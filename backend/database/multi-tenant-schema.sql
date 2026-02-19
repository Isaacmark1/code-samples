-- Multi-tenant account management schema
-- Demonstrates proper indexing, foreign keys, and data types

-- Users table with authentication and role management
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active),
    INDEX idx_users_last_seen (last_seen)
);

-- Accounts table for multi-broker integration
CREATE TABLE accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'My Account',
    type ENUM('live', 'demo', 'manual') NOT NULL DEFAULT 'manual',
    broker_name VARCHAR(100) NULL,
    account_type VARCHAR(50) NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    starting_balance DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    connection_status ENUM('connected', 'disconnected', 'error', 'not_applicable') DEFAULT 'not_applicable',
    is_active BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMP NULL,
    sync_enabled BOOLEAN DEFAULT FALSE,
    import_method ENUM('api', 'csv', 'manual') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint for data integrity
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Optimized indexes for common queries
    INDEX idx_accounts_user (user_id),
    INDEX idx_accounts_user_active (user_id, is_active),
    INDEX idx_accounts_type (type),
    INDEX idx_accounts_broker (broker_name),
    INDEX idx_accounts_sync_status (connection_status, sync_enabled)
);

-- Trades table with comprehensive tracking
CREATE TABLE trades (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_id BIGINT NULL,
    symbol VARCHAR(20) NOT NULL,
    trade_type ENUM('LONG', 'SHORT') NOT NULL,
    quantity DECIMAL(15, 8) NOT NULL,
    entry_price DECIMAL(15, 8) NOT NULL,
    exit_price DECIMAL(15, 8) NULL,
    stop_loss DECIMAL(15, 8) NULL,
    take_profit DECIMAL(15, 8) NULL,
    sl_hit BOOLEAN DEFAULT FALSE,
    tp_hit BOOLEAN DEFAULT FALSE,
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP NULL,
    trade_date DATE NOT NULL,
    status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
    strategy VARCHAR(100) NULL,
    notes TEXT NULL,
    tags JSON NULL, -- Store tags as JSON array
    fees DECIMAL(10, 2) DEFAULT 0,
    commission DECIMAL(10, 2) DEFAULT 0,
    profit_loss DECIMAL(15, 2) DEFAULT 0,
    net_profit_loss DECIMAL(15, 2) DEFAULT 0,
    return_percentage DECIMAL(8, 4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    
    -- Performance indexes for trading analytics
    INDEX idx_trades_user (user_id),
    INDEX idx_trades_account (account_id),
    INDEX idx_trades_user_account (user_id, account_id),
    INDEX idx_trades_symbol (symbol),
    INDEX idx_trades_status (status),
    INDEX idx_trades_date (trade_date),
    INDEX idx_trades_entry_time (entry_time),
    INDEX idx_trades_user_symbol (user_id, symbol),
    INDEX idx_trades_user_date (user_id, trade_date)
);

-- Trade analytics summary table for fast reporting
CREATE TABLE trade_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_id BIGINT NULL,
    date DATE NOT NULL,
    total_trades INT DEFAULT 0,
    winning_trades INT DEFAULT 0,
    losing_trades INT DEFAULT 0,
    total_profit_loss DECIMAL(15, 2) DEFAULT 0,
    total_fees DECIMAL(10, 2) DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    profit_factor DECIMAL(8, 2) DEFAULT 0,
    max_drawdown DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    
    -- Unique constraint to prevent duplicate daily records
    UNIQUE KEY unique_user_account_date (user_id, account_id, date),
    
    -- Indexes for analytics queries
    INDEX idx_analytics_user (user_id),
    INDEX idx_analytics_account (account_id),
    INDEX idx_analytics_date (date),
    INDEX idx_analytics_user_date (user_id, date)
);

-- Example of a junction table for many-to-many relationships
CREATE TABLE trade_tags (
    trade_id BIGINT NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
    
    -- Composite primary key
    PRIMARY KEY (trade_id, tag_name),
    
    -- Indexes for performance
    INDEX idx_trade_tags_trade (trade_id),
    INDEX idx_trade_tags_tag (tag_name)
);

-- Example of audit log table for security tracking
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NULL,
    record_id BIGINT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for audit queries
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_user_created (user_id, created_at)
);

-- Example of subscription management table
CREATE TABLE subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'trial') DEFAULT 'trial',
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for subscription queries
    INDEX idx_subscriptions_user (user_id),
    INDEX idx_subscriptions_status (status),
    INDEX idx_subscriptions_period_end (current_period_end),
    INDEX idx_subscriptions_user_status (user_id, status)
);
