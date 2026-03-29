import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import fs from 'fs';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let db: Database.Database | null = null;

// Enhanced logging for production
const logToFile = (level: string, args: any[]) => {
  try {
    const logPath = path.join(app.getPath('userData'), 'pos-app.log');
    const msg = `[${level}] ${new Date().toISOString()} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}\n`;
    fs.appendFileSync(logPath, msg);
  } catch (e) {
    console.error('Failed to write to log file', e);
  }
};

const logger = {
  info: (...args: any[]) => { console.log('[INFO]', new Date().toISOString(), ...args); logToFile('INFO', args); },
  error: (...args: any[]) => { console.error('[ERROR]', new Date().toISOString(), ...args); logToFile('ERROR', args); },
  warn: (...args: any[]) => { console.warn('[WARN]', new Date().toISOString(), ...args); logToFile('WARN', args); },
  debug: (...args: any[]) => {
    if (isDev) { console.debug('[DEBUG]', new Date().toISOString(), ...args); logToFile('DEBUG', args); }
  },
};

// Comprehensive migration and schema repair system
function checkDatabaseSchema(database: Database.Database) {
  try {
    logger.info('Performing schema verification...');
    const tables = ['settings', 'products', 'customers', 'sales', 'sale_items'];
    for (const table of tables) {
      const exists = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
      if (!exists) {
        logger.error(`CRITICAL: Table ${table} is missing! Database might be corrupt.`);
        return false;
      }
    }
    logger.info('All core tables verified.');
    return true;
  } catch (e) {
    logger.error('Schema verification failed:', e);
    return false;
  }
}

// Fixed migration system
function migrate(database: Database.Database) {
  try {
    const { user_version: ver } = database.prepare('PRAGMA user_version').get() as { user_version: number };
    logger.info(`Current database version: ${ver}`);

    // Migration 1: Add settings columns
    if (ver < 1) {
      logger.info('Running migration 1 - Adding settings columns...');
      const migrations = [
        `ALTER TABLE settings ADD COLUMN store_address TEXT DEFAULT ''`,
        `ALTER TABLE settings ADD COLUMN receipt_footer TEXT DEFAULT 'Thank you for visiting!'`,
        `ALTER TABLE settings ADD COLUMN pos_password TEXT DEFAULT '1234'`,
      ];
      for (const sql of migrations) {
        try { database.exec(sql); } catch (e) { logger.warn(`Migration 1 warning: ${e}`); }
      }
      database.exec('PRAGMA user_version = 1');
    }

    // Migration 2: Enhance sale_items table
    if (ver < 2) {
      logger.info('Running migration 2 - Enhancing sale_items table...');
      database.exec(`PRAGMA foreign_keys = OFF`);
      try {
        database.exec(`ALTER TABLE sale_items RENAME TO _sale_items_old`);
        database.exec(`
          CREATE TABLE sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL DEFAULT '',
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            is_custom INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
          )
        `);
        database.exec(`
          INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, price, is_custom)
          SELECT id, sale_id, product_id,
            COALESCE(product_name, ''),
            quantity, price,
            COALESCE(is_custom, 0)
          FROM _sale_items_old
        `);
        database.exec(`DROP TABLE _sale_items_old`);

        // Create indexes
        database.exec(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)`);
        database.exec(`CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id)`);
      } catch (e) {
        logger.error('Migration 2 error:', e);
        throw e;
      }
      database.exec(`PRAGMA foreign_keys = ON`);
      database.exec('PRAGMA user_version = 2');
    }

    // Migration 3: Enhance products table with unique constraint and timestamps
    if (ver < 3) {
      logger.info('Running migration 3 - Enhancing products table...');
      database.exec(`PRAGMA foreign_keys = OFF`);
      try {
        database.exec(`ALTER TABLE products RENAME TO _products_old`);
        database.exec(`
          CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            price REAL NOT NULL CHECK(price > 0),
            category TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        database.exec(`
          INSERT INTO products (id, name, price, category, created_at, updated_at)
          SELECT id, name, price, COALESCE(category, ''), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
          FROM _products_old
        `);
        database.exec(`DROP TABLE _products_old`);

        // Create indexes for better performance
        database.exec(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`);
        database.exec(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
      } catch (e) {
        logger.error('Migration 3 error:', e);
        throw e;
      }
      database.exec(`PRAGMA foreign_keys = ON`);
      database.exec('PRAGMA user_version = 3');
    }

    // Migration 4: Add indexes to sales table
    if (ver < 4) {
      logger.info('Running migration 4 - Adding indexes to sales table...');
      try {
        database.exec(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date_created)`);
        database.exec(`CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)`);
      } catch (e) {
        logger.error('Migration 4 error:', e);
      }
      database.exec('PRAGMA user_version = 4');
    }

    // Migration 5: Add customers table indexes
    if (ver < 5) {
      logger.info('Running migration 5 - Adding customers indexes...');
      try {
        database.exec(`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)`);
        database.exec(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`);
      } catch (e) {
        logger.error('Migration 5 error:', e);
      }
      database.exec('PRAGMA user_version = 5');
    }

    // Migration 6: Ensure created_at / updated_at exist in all tables if previously bypassed
    if (ver < 6) {
      logger.info('Running migration 6 - Fixing missing columns...');
      const statements = [
        `ALTER TABLE products ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE products ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE sale_items ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE customers ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE customers ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0`,
        `ALTER TABLE sales ADD COLUMN tax REAL DEFAULT 0`,
        `ALTER TABLE sales ADD COLUMN subtotal REAL DEFAULT 0`,
        `ALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT 'completed'`,
        `ALTER TABLE sales ADD COLUMN notes TEXT`
      ];
      for (const sql of statements) {
        try { database.exec(sql); } catch (e) { /* IGNORE IF COLUMN ALREADY EXISTS */ }
      }
      database.exec('PRAGMA user_version = 6');
    }

    // Migration 7: Add additional missing columns to sales table if bypassed previously
    if (ver < 7) {
      logger.info('Running migration 7 - Adding sales columns...');
      const statements = [
        `ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0`,
        `ALTER TABLE sales ADD COLUMN tax REAL DEFAULT 0`,
        `ALTER TABLE sales ADD COLUMN subtotal REAL DEFAULT 0`,
        `ALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT 'completed'`,
        `ALTER TABLE sales ADD COLUMN notes TEXT`
      ];
      for (const sql of statements) {
        try { database.exec(sql); } catch (e) { /* IGNORE */ }
      }
      database.exec('PRAGMA user_version = 7');
    }

    // Migration 8: Add invoice status
    if (ver < 8) {
      logger.info('Running migration 8 - Adding invoice status...');
      try { database.exec(`ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'Completed'`); } catch (e) { /* IGNORE */ }
      database.exec('PRAGMA user_version = 8');
    }

    // Migration 9: Add updated_at to settings
    if (ver < 9) {
      logger.info('Running migration 9 - Adding updated_at to settings...');
      try { database.exec(`ALTER TABLE settings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`); } catch (e) { /* IGNORE */ }
      database.exec('PRAGMA user_version = 9');
    }

    // Migration 10: Super-Failsafe Column Injection (Products, Sales, Sale Items, Customers)
    if (ver < 10) {
      logger.info('Running migration 10 - Final schema sync...');
      const checks = [
        ["products", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"],
        ["products", "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"],
        ["products", "category", "TEXT DEFAULT ''"],
        ["sales", "subtotal", "REAL DEFAULT 0"],
        ["sales", "discount", "REAL DEFAULT 0"],
        ["sales", "tax", "REAL DEFAULT 0"],
        ["sales", "payment_status", "TEXT DEFAULT 'completed'"],
        ["sales", "notes", "TEXT"],
        ["sales", "status", "TEXT DEFAULT 'Completed'"],
        ["sale_items", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"],
        ["sale_items", "is_custom", "INTEGER DEFAULT 0"],
        ["customers", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"],
        ["customers", "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"]
      ];
      for (const [table, col, def] of checks) {
        try { database.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch (e) { /* Already exists */ }
      }
      database.exec('PRAGMA user_version = 10');
    }

    // Migration 11: REPAIR BROKEN FOREIGN KEYS (Fix for "no such table: main._products_old")
    if (ver < 11) {
      logger.info('Running migration 11 - Repairing broken foreign keys...');
      database.exec('PRAGMA foreign_keys = OFF');
      try {
        // Drop any leftover temporary tables that might cause FK issues
        database.exec(`DROP TABLE IF EXISTS _products_old`);
        database.exec(`DROP TABLE IF EXISTS _sale_items_old`);
        database.exec(`DROP TABLE IF EXISTS _sales_old`);
        database.exec(`DROP TABLE IF EXISTS main_products_old`);

        // Recreate sale_items to ensure its foreign keys to 'products' and 'sales' point to current tables
        database.exec(`ALTER TABLE sale_items RENAME TO _sale_items_repair`);
        database.exec(`
          CREATE TABLE sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL DEFAULT '',
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            price REAL NOT NULL CHECK(price >= 0),
            is_custom INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
          )
        `);
        database.exec(`
          INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, price, is_custom, created_at)
          SELECT id, sale_id, product_id, product_name, quantity, price, is_custom, 
                 COALESCE(created_at, CURRENT_TIMESTAMP)
          FROM _sale_items_repair
        `);
        database.exec(`DROP TABLE _sale_items_repair`);

        // Restore indexes
        database.exec(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)`);
        database.exec(`CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id)`);

        logger.info('Migration 11 completed: sale_items foreign keys repaired.');
      } catch (e) {
        logger.error('Migration 11 failed:', e);
        throw e;
      }
      database.exec('PRAGMA foreign_keys = ON');
      database.exec('PRAGMA user_version = 11');
    }

    // Migration 12: Final Schema Cleanup & Index Verification
    if (ver < 12) {
      logger.info('Running migration 12 - Final schema cleanup...');
      const cleanupStmt = [
        `VACUUM`,
        `ANALYZE`,
        `PRAGMA main.integrity_check`,
        `DROP TABLE IF EXISTS _products_old`,
        `DROP TABLE IF EXISTS _sale_items_old`,
        `DROP TABLE IF EXISTS _sales_old`,
        `DROP TABLE IF EXISTS main_products_old`
      ];
      for (const sql of cleanupStmt) {
        try { database.exec(sql); } catch (e) { logger.warn(`Cleanup notice: ${sql} - ${e}`); }
      }
      database.exec('PRAGMA user_version = 12');
    }

    logger.info(`Database migration completed. Current version: ${database.pragma('user_version', { simple: true })}`);
  } catch (error) {
    logger.error('Migration system failed:', error);
    throw error;
  }
}

function initializeDatabase() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'pos.db');
    logger.info(`Initializing database at: ${dbPath}`);

    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);

    // Optimize database settings
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    db.pragma('synchronous = NORMAL'); // Good balance between safety and performance
    db.pragma('foreign_keys = ON');
    db.pragma('cache_size = -64000'); // 64MB cache
    db.pragma('temp_store = MEMORY');

    logger.info('Database pragmas configured');

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        store_name TEXT DEFAULT 'My Restaurant',
        store_phone TEXT DEFAULT '',
        store_address TEXT DEFAULT '',
        store_logo TEXT DEFAULT '',
        receipt_footer TEXT DEFAULT 'Thank you for visiting!',
        pos_password TEXT DEFAULT '1234',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO settings (id) VALUES (1);

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        price REAL NOT NULL CHECK(price > 0),
        category TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total REAL NOT NULL CHECK(total >= 0),
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
        payment_method TEXT DEFAULT 'cash',
        payment_status TEXT DEFAULT 'completed',
        status TEXT DEFAULT 'Completed',
        notes TEXT,
        FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL DEFAULT '',
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        price REAL NOT NULL CHECK(price >= 0),
        is_custom INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
      );
      
      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date_created);
      CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
      CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    `);

    // Run migrations
    db.exec('PRAGMA foreign_keys = OFF');
    migrate(db);
    db.exec('PRAGMA foreign_keys = ON');

    // Final integrity check
    if (!checkDatabaseSchema(db)) {
      throw new Error('Database schema verification failed after migrations');
    }

    logger.info('Database initialized and verified successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}
function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Looking for preload at:', preloadPath);
  console.log('Preload exists:', require('fs').existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded');
    mainWindow?.webContents.executeJavaScript(`
      console.log('API available:', !!window.api);
      if (window.api) {
        console.log('API methods:', Object.keys(window.api));
      }
    `);
  });

  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    logger.info('Window ready and shown');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // --- THIS WAS THE MISSING BRACE ---
  mainWindow?.webContents.on('render-process-gone', (event: any, details: any) => {
    logger.error('Render process gone:', details);
  });
}

// ============= EVENT LISTENERS =============


// ============= PRODUCT HANDLERS =============

ipcMain.handle('get-products', async () => {
  try {
    if (!db) throw new Error('Database not initialized');
    const products = db.prepare('SELECT * FROM products ORDER BY name').all();
    logger.debug(`Retrieved ${products.length} products`);
    return { success: true, data: products };
  } catch (error: any) {
    logger.error('Failed to get products:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-product', async (_, product: { name: string; price: number; category?: string }) => {
  try {
    if (!db) throw new Error('Database not initialized');

    if (!product.name?.trim()) throw new Error('Product name is required');
    const price = Number(product.price);
    if (isNaN(price) || price <= 0) throw new Error('Price must be a positive number');
    if (price > 9999999) throw new Error('Price is too high');

    const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(product.name.trim());
    if (existing) throw new Error(`Product "${product.name}" already exists`);

    const stmt = db.prepare(`
      INSERT INTO products (name, price, category, created_at, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    const info = stmt.run(product.name.trim(), price, product.category?.trim() || '');

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    logger.info(`Product added: ${product.name} (ID: ${info.lastInsertRowid})`);

    return { success: true, data: newProduct };
  } catch (error: any) {
    logger.error('Failed to add product:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-product', async (_, id: number, product: { name: string; price: number; category?: string }) => {
  try {
    if (!db) throw new Error('Database not initialized');
    if (!id || id <= 0) throw new Error('Invalid product ID');

    if (!product.name?.trim()) throw new Error('Product name is required');
    const price = Number(product.price);
    if (isNaN(price) || price <= 0) throw new Error('Price must be a positive number');

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) throw new Error('Product not found');

    const duplicate = db.prepare('SELECT id FROM products WHERE name = ? AND id != ?').get(product.name.trim(), id);
    if (duplicate) throw new Error(`Product "${product.name}" already exists`);

    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, price = ?, category = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(product.name.trim(), price, product.category?.trim() || '', id);

    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    logger.info(`Product updated: ${product.name} (ID: ${id})`);

    return { success: true, data: updatedProduct };
  } catch (error: any) {
    logger.error('Failed to update product:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-product', async (_, id: number) => {
  try {
    if (!db) throw new Error('Database not initialized');
    if (!id || id <= 0) throw new Error('Invalid product ID');

    const product = db.prepare('SELECT name FROM products WHERE id = ?').get(id);
    if (!product) throw new Error('Product not found');

    const usage = db.prepare('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?').get(id) as any;
    if (usage.count > 0) {
      throw new Error(`Cannot delete product "${(product as any).name}" as it's used in ${usage.count} sale(s)`);
    }

    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) throw new Error('Product not found or already deleted');

    logger.info(`Product deleted: ${(product as any).name} (ID: ${id})`);
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to delete product:', error);
    return { success: false, error: error.message };
  }
});

// ============= SETTINGS HANDLERS =============

ipcMain.handle('get-settings', async () => {
  try {
    if (!db) throw new Error('Database not initialized');
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    return { success: true, data: settings };
  } catch (error: any) {
    logger.error('Failed to get settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-settings', async (_, settings: any) => {
  try {
    if (!db) throw new Error('Database not initialized');

    const stmt = db.prepare(`
      UPDATE settings 
      SET store_name = ?, 
          store_phone = ?, 
          store_address = ?, 
          store_logo = ?, 
          receipt_footer = ?, 
          pos_password = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(
      settings.store_name || 'My Restaurant',
      settings.store_phone || '',
      settings.store_address || '',
      settings.store_logo || '',
      settings.receipt_footer || 'Thank you for visiting!',
      settings.pos_password || '1234'
    );

    const updatedSettings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    logger.info('Settings updated');

    return { success: true, data: updatedSettings };
  } catch (error: any) {
    logger.error('Failed to update settings:', error);
    return { success: false, error: error.message };
  }
});

// ============= SALES HANDLERS =============

ipcMain.handle('create-sale', async (_, data: {
  customer_id?: number;
  items: Array<{
    product_id?: number;
    product_name: string;
    quantity: number;
    price: number;
    is_custom?: boolean;
  }>;
  total: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  payment_method: string;
  notes?: string;
}) => {
  try {
    if (!db) throw new Error('Database not initialized');

    // Validate sale data
    if (!data.items || data.items.length === 0) throw new Error('Sale must have at least one item');
    if (data.total <= 0) throw new Error('Sale total must be positive');

    const transaction = db.transaction(() => {
      try {
        // Insert sale
        const saleStmt = db!.prepare(`
          INSERT INTO sales (customer_id, total, subtotal, discount, tax, payment_method, notes, date_created)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        const saleInfo = saleStmt.run(
          data.customer_id || null,
          data.total,
          data.subtotal || data.total,
          data.discount || 0,
          data.tax || 0,
          data.payment_method || 'cash',
          data.notes || null
        );

        const saleId = saleInfo.lastInsertRowid;

        // Insert sale items
        const itemStmt = db!.prepare(`
          INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, is_custom)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of data.items) {
          itemStmt.run(
            saleId,
            item.product_id || null,
            item.product_name,
            item.quantity,
            item.price,
            item.is_custom ? 1 : 0
          );
        }

        return saleId;
      } catch (innerError: any) {
        logger.error('Transaction failure:', innerError);
        // Specialized error handling for missing tables or foreign key errors
        if (innerError.message.includes('no such table')) {
          throw new Error(`Database structure error: ${innerError.message}. Please restart the app to run repairs.`);
        }
        throw innerError;
      }
    });

    const saleId = transaction();
    logger.info(`Sale created: ID ${saleId}, Total: ${data.total}`);

    return { success: true, data: { saleId } };
  } catch (error: any) {
    logger.error('Failed to create sale:', error);
    // Be very descriptive about the error for the frontend
    let userFriendlyError = error.message;
    if (error.message.includes('main._products_old')) {
      userFriendlyError = "Database integrity issue detected (_products_old reference). Automatic repair will run on next restart.";
    }
    return { success: false, error: userFriendlyError };
  }
});

ipcMain.handle('get-sales', async () => {
  try {
    if (!db) throw new Error('Database not initialized');

    const sales = db.prepare(`
      SELECT s.*, 
             c.name as customer_name,
             COUNT(si.id) as item_count,
             GROUP_CONCAT(DISTINCT si.product_name || ' (x' || si.quantity || ')') as items_summary
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id
      ORDER BY s.date_created DESC
    `).all();

    return { success: true, data: sales };
  } catch (error: any) {
    logger.error('Failed to get sales:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-sale-items', async (_, saleId: number) => {
  try {
    if (!db) throw new Error('Database not initialized');
    if (!saleId || saleId <= 0) throw new Error('Invalid sale ID');

    const items = db.prepare(`
      SELECT * FROM sale_items 
      WHERE sale_id = ? 
      ORDER BY id
    `).all(saleId);

    return { success: true, data: items };
  } catch (error: any) {
    logger.error('Failed to get sale items:', error);
    return { success: false, error: error.message };
  }
});

// ============= DASHBOARD HANDLERS =============

ipcMain.handle('get-dashboard-stats', async () => {
  try {
    if (!db) throw new Error('Database not initialized');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Helper functions
    const sumSince = (since: string) => {
      const result = db!.prepare("SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE date_created >= ? AND status = 'Completed'").get(since) as any;
      return result.total;
    };

    const countSince = (since: string) => {
      const result = db!.prepare('SELECT COUNT(*) as count FROM sales WHERE date_created >= ?').get(since) as any;
      return result.count;
    };

    const stats = {
      totalSalesToday: sumSince(todayStart),
      totalSalesWeek: sumSince(weekStart),
      totalSalesMonth: sumSince(monthStart),
      totalTransactions: (db.prepare('SELECT COUNT(*) as count FROM sales').get() as any).count,
      totalTransactionsToday: countSince(todayStart),
      totalProducts: (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count,
      totalCustomers: (db.prepare('SELECT COUNT(*) as count FROM customers').get() as any).count,
      topProducts: db.prepare(`
        SELECT 
          si.product_name as name, 
          SUM(si.quantity) as quantity_sold, 
          SUM(si.quantity * si.price) as revenue,
          COUNT(DISTINCT si.sale_id) as times_sold
        FROM sale_items si
        INNER JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'Completed'
        GROUP BY si.product_name
        ORDER BY quantity_sold DESC
        LIMIT 5
      `).all(),
      recentSales: db.prepare(`
        SELECT s.*, COUNT(si.id) as item_count
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        GROUP BY s.id
        ORDER BY s.date_created DESC
        LIMIT 10
      `).all(),
      paymentStats: db.prepare(`
        SELECT 
          payment_method,
          SUM(total) as revenue,
          COUNT(*) as count
        FROM sales
        WHERE status = 'Completed'
        GROUP BY payment_method
      `).all(),
    };

    logger.debug('Dashboard stats retrieved');
    return { success: true, data: stats };
  } catch (error: any) {
    logger.error('Failed to get dashboard stats:', error);
    return { success: false, error: error.message };
  }
});

// ============= REPORT HANDLERS =============

ipcMain.handle('get-report', async (_, period: 'today' | 'week' | 'month') => {
  try {
    if (!db) throw new Error('Database not initialized');

    const now = new Date();
    let startDate: string;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }

    const report = {
      period,
      startDate,
      sales: db.prepare(`
        SELECT s.*, c.name as customer_name, COUNT(si.id) as item_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.date_created >= ?
        GROUP BY s.id
        ORDER BY s.date_created DESC
      `).all(startDate),
      revenue: (db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM sales 
        WHERE date_created >= ? AND status = 'Completed'
      `).get(startDate) as any).total,
      totalSales: (db.prepare(`
        SELECT COUNT(*) as count 
        FROM sales 
        WHERE date_created >= ? AND status = 'Completed'
      `).get(startDate) as any).count,
      topProducts: db.prepare(`
        SELECT 
          si.product_name as name, 
          SUM(si.quantity) as quantity_sold, 
          SUM(si.quantity * si.price) as revenue,
          AVG(si.price) as avg_price
        FROM sale_items si
        INNER JOIN sales s ON si.sale_id = s.id
        WHERE s.date_created >= ?
        GROUP BY si.product_name
        ORDER BY quantity_sold DESC
        LIMIT 10
      `).all(startDate),
      salesByHour: db.prepare(`
        SELECT 
          strftime('%H', date_created) as hour,
          COUNT(*) as count,
          SUM(total) as total
        FROM sales
        WHERE date_created >= ?
        GROUP BY hour
        ORDER BY hour
      `).all(startDate),
      paymentMethods: db.prepare(`
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(total) as total
        FROM sales
        WHERE date_created >= ?
        GROUP BY payment_method
      `).all(startDate),
    };

    logger.info(`Report generated for period: ${period}`);
    return { success: true, data: report };
  } catch (error: any) {
    logger.error('Failed to generate report:', error);
    return { success: false, error: error.message };
  }
});

// ============= CUSTOMER HANDLERS =============

ipcMain.handle('get-customers', async () => {
  try {
    if (!db) throw new Error('Database not initialized');
    const customers = db.prepare(`
      SELECT c.*, COUNT(s.id) as total_sales, COALESCE(SUM(s.total), 0) as total_spent
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      GROUP BY c.id
      ORDER BY c.name
    `).all();
    return { success: true, data: customers };
  } catch (error: any) {
    logger.error('Failed to get customers:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-customer', async (_, customer: { name: string; phone?: string; email?: string; address?: string }) => {
  try {
    if (!db) throw new Error('Database not initialized');
    if (!customer.name?.trim()) throw new Error('Customer name is required');

    const stmt = db.prepare(`
      INSERT INTO customers (name, phone, email, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    const info = stmt.run(
      customer.name.trim(),
      customer.phone || null,
      customer.email || null,
      customer.address || null
    );

    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
    logger.info(`Customer added: ${customer.name} (ID: ${info.lastInsertRowid})`);

    return { success: true, data: newCustomer };
  } catch (error: any) {
    logger.error('Failed to add customer:', error);
    return { success: false, error: error.message };
  }
});
// ============= AUTH HANDLERS =============

// Add this to your main.ts file, replacing the existing verify-password handler

ipcMain.handle('verify-password', async (_, password: string) => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return false;
    }

    // Get the stored password
    const row = db.prepare('SELECT pos_password FROM settings WHERE id = 1').get() as any;

    // Check if password matches (fallback to '1234')
    const storedPassword = row?.pos_password || '1234';
    const isValid = storedPassword === password;

    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password verification: Input: "${password}", Stored: "${row?.pos_password}", Valid: ${isValid}`);
    }

    return isValid;
  } catch (error: any) {
    console.error('Password verification error:', error);
    return false;
  }
});
// ============= PRINTING HELPERS =============
function buildReceiptHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=302px"/>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: 72mm;
        margin: 0;
        padding: 0;
        background: white;
        color: #000;
        overflow: hidden; /* Prevent scrollbars in PDF */
      }
      body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        line-height: 1.5;
        padding: 8px 8px 24px 8px;
        display: block;
      }
      h2 { text-align: center; font-size: 14px; margin-bottom: 2px; }
      p { margin: 1px 0; }
      .center { text-align: center; }
      .divider {
        display: block;
        border-bottom: 1px dashed #000;
        margin: 5px 0;
        width: 100%;
      }
      .item {
        display: flex;
        justify-content: space-between;
        margin: 2px 0;
        gap: 4px;
      }
      .item span:first-child { flex: 1; word-break: break-word; }
      .total-row {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        font-size: 13px;
        margin-top: 4px;
      }
      .footer {
        text-align: center;
        margin-top: 10px;
        font-size: 11px;
        padding-bottom: 8px;
      }
      img {
        display: block;
        margin: 0 auto 6px;
        max-height: 48px;
        max-width: 280px;
        object-fit: contain;
      }
    </style>
  </head>
  <body>${content}</body>
</html>`;
}
// ============= PRINTING HANDLERS =============
ipcMain.handle('print-invoice', async (_, htmlContent: string) => {
  try {
    if (!mainWindow) throw new Error('No main window available');

    const html = buildReceiptHtml(htmlContent);

    const printWindow = new BrowserWindow({
      show: false,
      width: 302, // Exactly 72mm
      height: 2000, 
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Give layout engine and fonts time to stabilize
    await new Promise(resolve => setTimeout(resolve, 600));

    const contentHeightPx: number = await printWindow.webContents.executeJavaScript(
      'Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)'
    );

    const widthMicrons = 72000;
    const heightMicrons = Math.ceil(contentHeightPx * (25400 / 96)) + 8000;

    // Try actual printing first (for thermal printer)
    return new Promise((resolve) => {
      printWindow.webContents.print(
        {
          silent: false,
          printBackground: true,
          pageSize: { width: widthMicrons, height: heightMicrons },
          margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 },
          scaleFactor: 100,
        },
        (success, reason) => {
          printWindow.close();
          if (success) {
            logger.info('Invoice printed successfully');
            resolve({ success: true });
          } else {
            logger.error('Print failed:', reason);
            resolve({ success: false, error: reason });
          }
        }
      );
    });
  } catch (error: any) {
    logger.error('Failed to print invoice:', error);
    return { success: false, error: error.message };
  }
});

// ── Save as properly-sized PDF (bypasses system dialog A4 issue) ──
ipcMain.handle('save-invoice-pdf', async (_, htmlContent: string) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Receipt as PDF',
      defaultPath: `receipt-${Date.now()}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) return { success: false, error: 'Cancelled' };

    const html = buildReceiptHtml(htmlContent);

    const printWindow = new BrowserWindow({
      show: false,
      width: 302, // Exactly 72mm (72 / 25.4 * 96)
      height: 2000, // Start large to get full height
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Extra tick for font loading and layout
    await new Promise(resolve => setTimeout(resolve, 600));

    const contentHeightPx: number = await printWindow.webContents.executeJavaScript(
      'Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)'
    );

    // Thermal widths: 
    // 80mm = 80000 microns
    // 72mm = 72000 microns (standard label width on 80mm rolls)
    // 58mm = 58000 microns
    const widthMicrons = 72000;
    // Add 8mm bottom padding buffer
    const heightMicrons = Math.ceil(contentHeightPx * (25400 / 96)) + 8000;

    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: { width: widthMicrons, height: heightMicrons },
      margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 },
    });

    printWindow.close();
    fs.writeFileSync(filePath, pdfBuffer);
    logger.info(`Receipt PDF saved: ${filePath}`);
    return { success: true, path: filePath };

  } catch (error: any) {
    logger.error('Failed to save PDF:', error);
    return { success: false, error: error.message };
  }
});
// ============= UTILITY HANDLERS =============

ipcMain.handle('backup-database', async () => {
  try {
    if (!db) throw new Error('Database not initialized');

    const backupPath = path.join(app.getPath('userData'), `backup_${Date.now()}.db`);

    // Fix: Pass the path string directly and await the promise
    await (db as any).backup(backupPath);

    logger.info(`Database backed up to: ${backupPath}`);
    return { success: true, path: backupPath };
  } catch (error: any) {
    logger.error('Backup failed:', error);
    return { success: false, error: error.message };
  }
});

// ============= NEW HANDLERS =============

ipcMain.handle('update-sale-status', async (_, saleId: number, status: string) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const validStatuses = ['Completed', 'Returned', 'Cancelled'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');

    db.prepare('UPDATE sales SET status = ? WHERE id = ?').run(status, saleId);
    logger.info(`Sale ${saleId} status updated to ${status}`);
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to update sale status:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-all-data', async () => {
  try {
    if (!db) throw new Error('Database not initialized');
    db.prepare('PRAGMA foreign_keys = OFF').run();
    db.prepare('DELETE FROM sale_items').run();
    db.prepare('DELETE FROM sales').run();
    db.prepare('DELETE FROM customers').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM sqlite_sequence').run(); // Reset AI counters
    db.prepare('PRAGMA foreign_keys = ON').run();
    logger.info('All data deleted successfully');
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to delete all data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-data', async () => {
  try {
    if (!db) throw new Error('Database not initialized');
    const data = {
      settings: db.prepare('SELECT * FROM settings').all(),
      products: db.prepare('SELECT * FROM products').all(),
      customers: db.prepare('SELECT * FROM customers').all(),
      sales: db.prepare('SELECT * FROM sales').all(),
      sale_items: db.prepare('SELECT * FROM sale_items').all(),
    };
    logger.info('Data exported successfully');
    return { success: true, data };
  } catch (error: any) {
    logger.error('Failed to export data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-data', async (_, data: any) => {
  try {
    if (!db) throw new Error('Database not initialized');
    if (!data.settings || !data.products || !data.customers || !data.sales || !data.sale_items) {
      throw new Error('Invalid import data format');
    }

    db.transaction(() => {
      db!.prepare('PRAGMA foreign_keys = OFF').run();

      // Clear existing
      db!.prepare('DELETE FROM sale_items').run();
      db!.prepare('DELETE FROM sales').run();
      db!.prepare('DELETE FROM customers').run();
      db!.prepare('DELETE FROM products').run();
      db!.prepare('DELETE FROM settings').run();

      // Insert Settings
      const insertSetting = db!.prepare('INSERT INTO settings (id, store_name, store_phone, store_address, store_logo, receipt_footer, pos_password, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const s of data.settings) {
        insertSetting.run(s.id, s.store_name, s.store_phone, s.store_address, s.store_logo, s.receipt_footer, s.pos_password, s.updated_at);
      }

      // Insert Products
      const insertProduct = db!.prepare('INSERT INTO products (id, name, price, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      for (const p of data.products) {
        insertProduct.run(p.id, p.name, p.price, p.category, p.created_at, p.updated_at);
      }

      // Insert Customers
      const insertCustomer = db!.prepare('INSERT INTO customers (id, name, phone, email, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const c of data.customers) {
        insertCustomer.run(c.id, c.name, c.phone, c.email, c.address, c.created_at, c.updated_at);
      }

      // Insert Sales
      const insertSale = db!.prepare('INSERT INTO sales (id, customer_id, total, discount, tax, subtotal, date_created, payment_method, payment_status, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      for (const s of data.sales) {
        insertSale.run(s.id, s.customer_id, s.total, s.discount || 0, s.tax || 0, s.subtotal || s.total, s.date_created, s.payment_method, s.payment_status, s.status || 'Completed', s.notes);
      }

      // Insert Sale Items
      const insertSaleItem = db!.prepare('INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, price, is_custom, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const si of data.sale_items) {
        insertSaleItem.run(si.id, si.sale_id, si.product_id, si.product_name, si.quantity, si.price, si.is_custom, si.created_at);
      }

      db!.prepare('PRAGMA foreign_keys = ON').run();
    })();

    logger.info('Data imported successfully');
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to import data:', error);
    return { success: false, error: error.message };
  }
});
// ============= APP LIFECYCLE =============

app.whenReady().then(() => {
  try {
    initializeDatabase();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    logger.info('Application started successfully');
  } catch (error) {
    logger.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    logger.info('Closing database connection...');
    db.close();
    logger.info('Database connection closed');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
})