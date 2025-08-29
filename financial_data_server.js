const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// Database configuration - using the same config as your example
const dbConfig = {
    user: 'jkasadmin',
    password: 'P@ssw0rd',
    server: 'jkas-server.database.windows.net',
    database: 'jkasdb',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

// Connect to database
async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to SQL Server database: JKAS (Financial Dashboard)');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

// Initialize database connection
connectDB();

// API endpoint to get financial data for dashboard
app.get('/api/financial_data', async (req, res) => {
    try {
        const { year, category, month, subcategory } = req.query;
        
        let query = `
            SELECT 
                id,
                year,
                category,
                subcategory,
                jenis_bulan,
                januari,
                februari,
                march,
                april,
                may,
                june,
                july,
                august,
                september,
                october,
                november,
                december,
                total_amount,
                currency,
                data_source,
                created_at
            FROM financial_data
            WHERE 1=1
        `;
        
        const request = new sql.Request();
        
        // Add filters
        if (year) {
            query += ` AND year = @year`;
            request.input('year', sql.Int, parseInt(year));
        }
        
        if (category) {
            query += ` AND category = @category`;
            request.input('category', sql.NVarChar, category);
        }
        
        if (subcategory) {
            query += ` AND subcategory = @subcategory`;
            request.input('subcategory', sql.NVarChar, subcategory);
        }
        
        // Month filter - check if any monthly column has data
        if (month) {
            const monthNames = ['januari', 'februari', 'march', 'april', 'may', 'june',
                              'july', 'august', 'september', 'october', 'november', 'december'];
            const monthField = monthNames[parseInt(month) - 1];
            if (monthField) {
                query += ` AND ${monthField} > 0`;
            }
        }
        
        query += ` ORDER BY year DESC, category, subcategory`;
        
        console.log('Executing financial data query:', query);
        console.log('Query parameters:', { year, category, month, subcategory });
        
        const result = await request.query(query);
        console.log('Financial data query result:', result.recordset.length, 'rows returned');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching financial data:', err);
        res.status(500).json({ 
            error: 'Failed to fetch financial data', 
            details: err.message 
        });
    }
});

// API endpoint to get yearly summary data
app.get('/api/yearly-summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                year,
                category,
                SUM(total_amount) as total_yearly_amount,
                COUNT(*) as record_count
            FROM financial_data
            GROUP BY year, category
            ORDER BY year DESC, total_yearly_amount DESC
        `;
        
        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching yearly summary:', err);
        res.status(500).json({ error: 'Failed to fetch yearly summary' });
    }
});

// API endpoint to get monthly trends
app.get('/api/monthly-trends', async (req, res) => {
    try {
        const { year, category } = req.query;
        
        let query = `
            SELECT 
                category,
                SUM(januari) as total_jan,
                SUM(februari) as total_feb,
                SUM(march) as total_mar,
                SUM(april) as total_apr,
                SUM(may) as total_may,
                SUM(june) as total_jun,
                SUM(july) as total_jul,
                SUM(august) as total_aug,
                SUM(september) as total_sep,
                SUM(october) as total_oct,
                SUM(november) as total_nov,
                SUM(december) as total_dec
            FROM financial_data
            WHERE 1=1
        `;
        
        const request = new sql.Request();
        
        if (year) {
            query += ` AND year = @year`;
            request.input('year', sql.Int, parseInt(year));
        }
        
        if (category) {
            query += ` AND category = @category`;
            request.input('category', sql.NVarChar, category);
        }
        
        query += ` GROUP BY category ORDER BY category`;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching monthly trends:', err);
        res.status(500).json({ error: 'Failed to fetch monthly trends' });
    }
});

// API endpoint to get category breakdown
app.get('/api/category-breakdown', async (req, res) => {
    try {
        const { year } = req.query;
        
        let query = `
            SELECT 
                category,
                SUM(total_amount) as total_amount,
                COUNT(*) as record_count
            FROM financial_data
            WHERE 1=1
        `;
        
        const request = new sql.Request();
        
        if (year) {
            query += ` AND year = @year`;
            request.input('year', sql.Int, parseInt(year));
        }
        
        query += ` GROUP BY category ORDER BY total_amount DESC`;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching category breakdown:', err);
        res.status(500).json({ error: 'Failed to fetch category breakdown' });
    }
});

// API endpoint to get subcategory analysis
app.get('/api/subcategory-analysis', async (req, res) => {
    try {
        const { year, category } = req.query;
        
        let query = `
            SELECT 
                category,
                subcategory,
                SUM(total_amount) as subcategory_total,
                COUNT(*) as record_count
            FROM financial_data
            WHERE 1=1
        `;
        
        const request = new sql.Request();
        
        if (year) {
            query += ` AND year = @year`;
            request.input('year', sql.Int, parseInt(year));
        }
        
        if (category) {
            query += ` AND category = @category`;
            request.input('category', sql.NVarChar, category);
        }
        
        query += ` GROUP BY category, subcategory ORDER BY subcategory_total DESC`;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching subcategory analysis:', err);
        res.status(500).json({ error: 'Failed to fetch subcategory analysis' });
    }
});

// API endpoint to get quarterly data
app.get('/api/quarterly-data', async (req, res) => {
    try {
        const { year, category } = req.query;
        
        let query = `
            SELECT 
                year,
                category,
                SUM(januari + februari + march) as Q1,
                SUM(april + may + june) as Q2,
                SUM(july + august + september) as Q3,
                SUM(october + november + december) as Q4
            FROM financial_data
            WHERE 1=1
        `;
        
        const request = new sql.Request();
        
        if (year) {
            query += ` AND year = @year`;
            request.input('year', sql.Int, parseInt(year));
        }
        
        if (category) {
            query += ` AND category = @category`;
            request.input('category', sql.NVarChar, category);
        }
        
        query += ` GROUP BY year, category ORDER BY year DESC, category`;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching quarterly data:', err);
        res.status(500).json({ error: 'Failed to fetch quarterly data' });
    }
});

// API endpoint to get growth analysis
app.get('/api/growth-analysis', async (req, res) => {
    try {
        const query = `
            WITH YearlyTotals AS (
                SELECT 
                    year,
                    category,
                    SUM(total_amount) as yearly_total
                FROM financial_data
                GROUP BY year, category
            ),
            GrowthCalc AS (
                SELECT 
                    year,
                    category,
                    yearly_total,
                    LAG(yearly_total) OVER (PARTITION BY category ORDER BY year) as previous_year_total
                FROM YearlyTotals
            )
            SELECT 
                year,
                category,
                yearly_total,
                previous_year_total,
                CASE 
                    WHEN previous_year_total > 0 
                    THEN ROUND(((yearly_total - previous_year_total) / previous_year_total) * 100, 2)
                    ELSE 0 
                END as growth_percentage
            FROM GrowthCalc
            WHERE previous_year_total IS NOT NULL
            ORDER BY year DESC, category
        `;
        
        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching growth analysis:', err);
        res.status(500).json({ error: 'Failed to fetch growth analysis' });
    }
});

// API endpoint to get top performers
app.get('/api/top-performers', async (req, res) => {
    try {
        const { year, limit = 10 } = req.query;
        
        let query = `
            SELECT TOP ${parseInt(limit)}
                category,
                subcategory,
                SUM(total_amount) as total_amount,
                COUNT(*) as record_count
            FROM financial_data
            WHERE 1=1
        `;
        
        const request = new sql.Request();
        
        if (year) {
            query += ` AND year = @year`;
            request.input('year', sql.Int, parseInt(year));
        }
        
        query += `
            GROUP BY category, subcategory 
            ORDER BY total_amount DESC
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching top performers:', err);
        res.status(500).json({ error: 'Failed to fetch top performers' });
    }
});

// API endpoint to get distinct years
app.get('/api/years', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT year 
            FROM financial_data 
            ORDER BY year DESC
        `;
        
        const result = await sql.query(query);
        const years = result.recordset.map(row => row.year);
        res.json(years);
    } catch (err) {
        console.error('Error fetching years:', err);
        res.status(500).json({ error: 'Failed to fetch years' });
    }
});

// API endpoint to get distinct categories
app.get('/api/categories', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT category 
            FROM financial_data 
            WHERE category IS NOT NULL 
            ORDER BY category
        `;
        
        const result = await sql.query(query);
        const categories = result.recordset.map(row => row.category);
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// API endpoint to get summary statistics
app.get('/api/summary-stats', async (req, res) => {
    try {
        const { year, category } = req.query;
        
        let baseQuery = `
            SELECT 
                COUNT(*) as total_records,
                SUM(total_amount) as total_revenue,
                COUNT(DISTINCT category) as active_categories,
                COUNT(DISTINCT year) as years_span,
                AVG(total_amount) as average_amount
            FROM financial_data
            WHERE 1=1
        `;
        
        const request = new sql.Request();
        
        if (year) {
            baseQuery += ` AND year = @year`;
            request.input('year', sql.Int, parseInt(year));
        }
        
        if (category) {
            baseQuery += ` AND category = @category`;
            request.input('category', sql.NVarChar, category);
        }
        
        // Get growth calculation
        const growthQuery = `
            WITH YearlyTotals AS (
                SELECT 
                    year,
                    SUM(total_amount) as yearly_total
                FROM financial_data
                GROUP BY year
            ),
            RecentYears AS (
                SELECT TOP 2 year, yearly_total
                FROM YearlyTotals
                ORDER BY year DESC
            )
            SELECT 
                CASE 
                    WHEN COUNT(*) = 2 THEN
                        ROUND(((MAX(yearly_total) - MIN(yearly_total)) / MIN(yearly_total)) * 100, 1)
                    ELSE 0 
                END as yearly_growth
            FROM RecentYears
        `;
        
        const [summaryResult, growthResult] = await Promise.all([
            request.query(baseQuery),
            sql.query(growthQuery)
        ]);
        
        const summary = summaryResult.recordset[0];
        const growth = growthResult.recordset[0];
        
        res.json({
            ...summary,
            yearly_growth: growth.yearly_growth || 0
        });
    } catch (err) {
        console.error('Error fetching summary stats:', err);
        res.status(500).json({ error: 'Failed to fetch summary stats' });
    }
});

// API endpoint to get chart data (generic endpoint for multiple chart types)
app.get('/api/chart-data/:chartType', async (req, res) => {
    try {
        const { chartType } = req.params;
        const { year, category, month } = req.query;
        
        let query, chartData;
        
        switch (chartType) {
            case 'yearly-trends':
                query = `
                    SELECT 
                        year,
                        SUM(total_amount) as total_amount
                    FROM financial_data
                    GROUP BY year
                    ORDER BY year
                `;
                break;
                
            case 'category-breakdown':
                query = `
                    SELECT 
                        category,
                        SUM(total_amount) as total_amount
                    FROM financial_data
                    ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    GROUP BY category
                    ORDER BY total_amount DESC
                `;
                break;
                
            case 'monthly-performance':
                query = `
                    SELECT 
                        'January' as month, SUM(januari) as amount FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'February', SUM(februari) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'March', SUM(march) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'April', SUM(april) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'May', SUM(may) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'June', SUM(june) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'July', SUM(july) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'August', SUM(august) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'September', SUM(september) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'October', SUM(october) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'November', SUM(november) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                    UNION ALL SELECT 'December', SUM(december) FROM financial_data ${year ? `WHERE year = ${parseInt(year)}` : ''}
                `;
                break;
                
            default:
                return res.status(400).json({ error: 'Invalid chart type' });
        }
        
        const result = await sql.query(query);
        
        // Format data for Chart.js
        if (chartType === 'yearly-trends') {
            chartData = {
                labels: result.recordset.map(row => row.year.toString()),
                datasets: [{
                    label: 'Total Revenue (RM)',
                    data: result.recordset.map(row => row.total_amount || 0),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)'
                }]
            };
        } else if (chartType === 'monthly-performance') {
            chartData = {
                labels: result.recordset.map(row => row.month),
                datasets: [{
                    label: 'Monthly Revenue (RM)',
                    data: result.recordset.map(row => row.amount || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            };
        } else {
            chartData = {
                labels: result.recordset.map(row => row.category || row.year?.toString() || ''),
                datasets: [{
                    label: 'Amount (RM)',
                    data: result.recordset.map(row => row.total_amount || row.amount || 0),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            };
        }
        
        res.json(chartData);
    } catch (err) {
        console.error('Error fetching chart data:', err);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// Debug endpoint to check database connection and table
app.get('/api/debug/connection', async (req, res) => {
    try {
        const result = await sql.query('SELECT COUNT(*) as record_count FROM financial_data');
        res.json({
            status: 'Connected',
            database: 'jkasdb',
            table: 'financial_data',
            total_records: result.recordset[0].record_count
        });
    } catch (err) {
        console.error('Debug connection error:', err);
        res.status(500).json({ 
            status: 'Error',
            error: err.message 
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Financial Dashboard server running at http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/financial_data.html to view the dashboard`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down Financial Dashboard server...');
    try {
        await sql.close();
        console.log('Database connection closed.');
    } catch (err) {
        console.error('Error closing database connection:', err);
    }
    process.exit(0);
});