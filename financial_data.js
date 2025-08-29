// Financial Dashboard Application
// This application provides analytics and visualization for financial data

// API base URL - use relative path for production
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3002/api' : '/api';

// Global variables
let financialData = [];
let charts = {};
let currentFilters = {
    year: '',
    category: '',
    month: '',
    startDate: '',
    endDate: ''
};

// Inject CSS styles
function injectStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }
        
        .chart-tile {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
            min-height: 400px;
            display: flex;
            flex-direction: column;
        }
        
        .tile-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .tile-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }
        
        .tile-controls {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .chart-type-selector select {
            padding: 5px;
            border-radius: 4px;
            border: 1px solid #ddd;
            font-size: 12px;
        }
        
        .control-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        
        .control-btn:hover {
            background: #0056b3;
        }
        
        .chart-container {
            flex: 1;
            position: relative;
            min-height: 300px;
        }
        
        #chartModal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(styleSheet);
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing Financial Dashboard...');
    
    try {
        // Inject CSS styles
        injectStyles();
        
        // Create dashboard tiles
        createDashboardTiles();
        
        // Create date range filter
        createDateRangeFilter();
        
        // Load filter options from database
        await loadFilterOptions();
        
        // Load initial data from database
        await loadFinancialData();
        
        // Update all charts with initial data
        updateAllCharts();
        
        // Update summary statistics
        await updateSummaryStats();
        
        console.log('Dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        
        // Show a user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f8d7da;
            color: #721c24;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            max-width: 500px;
            text-align: center;
            z-index: 1000;
        `;
        errorDiv.innerHTML = `
            <h3>Dashboard Loading Error</h3>
            <p>Unable to load the dashboard. Please check:</p>
            <ul style="text-align: left;">
                <li>Server is running on port 3002</li>
                <li>Database is accessible</li>
                <li>Network connection is stable</li>
            </ul>
            <button onclick="location.reload()" style="
                background: #721c24;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">Retry</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Create date range filter
function createDateRangeFilter() {
    let container = document.getElementById('filtersContainer');
    
    // Create filters container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'filtersContainer';
        container.style.cssText = `
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        `;
        document.body.appendChild(container);
    }
    
    // Create filter HTML
    container.innerHTML = `
        <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
            <div>
                <label for="yearFilter" style="font-weight: bold; margin-right: 5px;">Year:</label>
                <select id="yearFilter" onchange="updateAllCharts()" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
                    <option value="">All Years</option>
                </select>
            </div>
            
            <div>
                <label for="categoryFilter" style="font-weight: bold; margin-right: 5px;">Category:</label>
                <select id="categoryFilter" onchange="updateAllCharts()" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
                    <option value="">All Categories</option>
                </select>
            </div>
            
            <div>
                <label for="monthFilter" style="font-weight: bold; margin-right: 5px;">Month:</label>
                <select id="monthFilter" onchange="updateAllCharts()" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
                    <option value="">All Months</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>
            </div>
            
            <div>
                <label for="startDate" style="font-weight: bold; margin-right: 5px;">From:</label>
                <input type="date" id="startDate" onchange="updateDateFilter()" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
            </div>
            
            <div>
                <label for="endDate" style="font-weight: bold; margin-right: 5px;">To:</label>
                <input type="date" id="endDate" onchange="updateDateFilter()" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
            </div>
            
            <button onclick="clearDateFilter()" style="
                padding: 8px 12px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">Clear Dates</button>
            
            <button onclick="exportDashboardPDF()" style="
                padding: 8px 12px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">📄 Export Dashboard</button>
        </div>
        
        <div id="summaryStats" style="
            margin-top: 15px;
            padding: 15px;
            background: white;
            border-radius: 6px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        ">
            <div>
                <strong>Total Revenue:</strong> <span id="totalRevenue">RM 0</span>
            </div>
            <div>
                <strong>Records:</strong> <span id="totalRecords">0</span>
            </div>
            <div>
                <strong>Categories:</strong> <span id="activeCategories">0</span>
            </div>
            <div>
                <strong>Growth:</strong> <span id="yearlyGrowth">0%</span>
            </div>
        </div>
    `;
}

// Load filter options from database
async function loadFilterOptions() {
    try {
        // Load years
        const yearsResponse = await fetch(`${API_BASE_URL}/years`);
        if (!yearsResponse.ok) throw new Error('Failed to fetch years');
        const years = await yearsResponse.json();
        
        const yearSelect = document.getElementById('yearFilter');
        if (yearSelect) {
            yearSelect.innerHTML = '<option value="">All Years</option>';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
        }
        
        // Load categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categories = await categoriesResponse.json();
        
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Load financial data from database
async function loadFinancialData() {
    try {
        const params = new URLSearchParams();
        
        if (currentFilters.year) params.append('year', currentFilters.year);
        if (currentFilters.category) params.append('category', currentFilters.category);
        if (currentFilters.month) params.append('month', currentFilters.month);
        
        const response = await fetch(`${API_BASE_URL}/financial_data?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        financialData = await response.json();
        console.log('Financial data loaded:', financialData.length, 'records');
        
    } catch (error) {
        console.error('Error loading financial data:', error);
        throw error;
    }
}

// Dashboard configuration
const dashboardConfig = [
    {
        id: 'yearlyTrends',
        title: 'Hasil Tahunan',
        type: 'line',
        description: 'Jumlah Tuntutan Pembayaran (RM)'
    },
    {
        id: 'categoryBreakdown',
        title: 'Hasil Mengikut Parlimen',
        type: 'bar',
        description: 'Jumlah Tuntutan Pembayaran (RM) mengikut parlimen'
    },
    {
        id: 'monthlyPerformance',
        title: 'Hasil Bulanan',
        type: 'bar',
        description: 'Jumlah Tuntutan Pembayaran (RM) mengikut bulan'
    },
    {
        id: 'subcategoryAnalysis',
        title: 'Pembersihan',
        type: 'bar',
        description: 'Perkhidmatan Pembersihan (RM)'
    },
    {
        id: 'quarterlyComparison',
        title: 'P.Jalan',
        type: 'bar',
        description: 'Pembayaran Perkhidmatan Sapuan Jalan (RM)'
    },
    {
        id: 'growthAnalysis',
        title: 'P.Longkang',
        type: 'bar',
        description: 'Pembayaran Perkhidmatan Longkang (RM)'
    },
    {
        id: 'topPerformers',
        title: 'P.Rumput',
        type: 'bar',
        description: 'Pembayaran Perkhidmatan Rumput (RM)'
    },
    {
        id: 'seasonalTrends',
        title: 'Rumusan',
        type: 'bar',
        description: 'Jumlah Tuntutan Pembayaran (RM) Kutipan Sisa Pepejal Dan Pembersihan Awam'
    },
    {
        id: 'distributionAnalysis',
        title: 'Hari-hari Festive',
        type: 'scatter',
        description: 'Revenue distribution analysis'
    }
];

// Create dashboard tiles
function createDashboardTiles() {
    let dashboardGrid = document.getElementById('dashboardGrid');
    
    // Create dashboard grid if it doesn't exist
    if (!dashboardGrid) {
        dashboardGrid = document.createElement('div');
        dashboardGrid.id = 'dashboardGrid';
        dashboardGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            padding: 20px;
        `;
        document.body.appendChild(dashboardGrid);
    }
    
    dashboardGrid.innerHTML = '';
    
    dashboardConfig.forEach(config => {
        const tile = createChartTile(config);
        dashboardGrid.appendChild(tile);
    });
}

// Create individual chart tile
function createChartTile(config) {
    const tile = document.createElement('div');
    tile.className = 'chart-tile';
    tile.id = `tile-${config.id}`;
    
    tile.innerHTML = `
        <div class="tile-header">
            <div>
                <div class="tile-title">${config.title}</div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">${config.description}</div>
            </div>
            <div class="tile-controls">
                <div class="chart-type-selector">
                    <select onchange="changeChartType('${config.id}', this.value)">
                        <option value="bar" ${config.type === 'bar' ? 'selected' : ''}>Bar</option>
                        <option value="line" ${config.type === 'line' ? 'selected' : ''}>Line</option>
                        <option value="doughnut" ${config.type === 'doughnut' ? 'selected' : ''}>Doughnut</option>
                        <option value="radar" ${config.type === 'radar' ? 'selected' : ''}>Radar</option>
                        <option value="polarArea" ${config.type === 'polarArea' ? 'selected' : ''}>Polar</option>
                        <option value="scatter" ${config.type === 'scatter' ? 'selected' : ''}>Scatter</option>
                    </select>
                </div>
                <button class="control-btn" onclick="expandChart('${config.id}')" title="Expand Chart">🔍</button>
                <button class="control-btn" onclick="downloadChart('${config.id}')" title="Download PDF">📄</button>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="chart-${config.id}"></canvas>
        </div>
    `;
    
    return tile;
}

// Generate chart data based on configuration
function generateChartData(config) {
    const filteredData = applyFilters(financialData);
    
    switch(config.id) {
        case 'yearlyTrends':
            return generateYearlyTrendsData(filteredData);
        case 'categoryBreakdown':
            return generateCategoryBreakdownData(filteredData);
        case 'monthlyPerformance':
            return generateMonthlyPerformanceData(filteredData);
        case 'subcategoryAnalysis':
            return generateSubcategoryAnalysisData(filteredData);
        case 'quarterlyComparison':
            return generateQuarterlyComparisonData(filteredData);
        case 'growthAnalysis':
            return generateGrowthAnalysisData(filteredData);
        case 'topPerformers':
            return generateTopPerformersData(filteredData);
        case 'seasonalTrends':
            return generateSeasonalTrendsData(filteredData);
        case 'distributionAnalysis':
            return generateDistributionAnalysisData(filteredData);
        default:
            return { labels: [], datasets: [] };
    }
}

// Data generation functions
function generateYearlyTrendsData(data) {
    const yearlyData = {};
    data.forEach(item => {
        if (!yearlyData[item.year]) yearlyData[item.year] = 0;
        yearlyData[item.year] += item.total_amount;
    });
    
    return {
        labels: Object.keys(yearlyData).sort(),
        datasets: [{
            label: 'Total Revenue (RM)',
            data: Object.keys(yearlyData).sort().map(year => yearlyData[year]),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4
        }]
    };
}

function generateCategoryBreakdownData(data) {
    const categoryData = {};
    data.forEach(item => {
        if (!categoryData[item.category]) categoryData[item.category] = 0;
        categoryData[item.category] += item.total_amount;
    });
    
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    return {
        labels: Object.keys(categoryData),
        datasets: [{
            data: Object.values(categoryData),
            backgroundColor: colors.slice(0, Object.keys(categoryData).length),
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };
}

function generateMonthlyPerformanceData(data) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const monthlyData = new Array(12).fill(0);
    
    data.forEach(item => {
        monthlyData[0] += item.januari || 0;
        monthlyData[1] += item.februari || 0;
        monthlyData[2] += item.march || 0;
        monthlyData[3] += item.april || 0;
        monthlyData[4] += item.may || 0;
        monthlyData[5] += item.june || 0;
        monthlyData[6] += item.july || 0;
        monthlyData[7] += item.august || 0;
        monthlyData[8] += item.september || 0;
        monthlyData[9] += item.october || 0;
        monthlyData[10] += item.november || 0;
        monthlyData[11] += item.december || 0;
    });
    
    return {
        labels: months,
        datasets: [{
            label: 'Monthly Revenue (RM)',
            data: monthlyData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
}

function generateSubcategoryAnalysisData(data) {
    // Filter data for Pembersihan category only
    const pembersihan = data.filter(item => item.category === 'Pembersihan');
    
    if (pembersihan.length === 0) {
        return { labels: [], datasets: [] };
    }
    
    // Get all subcategories for Pembersihan
    const subcategories = [...new Set(pembersihan.map(item => item.subcategory))];
    
    // Calculate monthly totals for each subcategory
    const months = ['januari', 'februari', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create datasets for each subcategory
    const colors = [
        'rgba(255, 99, 132, 0.8)',   // Red for Rumput
        'rgba(54, 162, 235, 0.8)',   // Blue for Jalan Perumahan  
        'rgba(255, 205, 86, 0.8)',   // Yellow for Jalan Komersial
        'rgba(75, 192, 192, 0.8)',   // Teal for Longkang Perumahan
        'rgba(153, 102, 255, 0.8)',  // Purple for Longkang Komersial
        'rgba(255, 159, 64, 0.8)',   // Orange for Tempat Awam
        'rgba(199, 199, 199, 0.8)',  // Gray for Pasar Malam
        'rgba(83, 102, 255, 0.8)',   // Blue for Pasar Awam
        'rgba(255, 99, 255, 0.8)',   // Pink for Jejantas
        'rgba(99, 255, 132, 0.8)'    // Green for Penjaja
    ];
    
    const datasets = subcategories.map((subcategory, index) => {
        const monthlyData = months.map(month => {
            const categoryData = pembersihan.filter(item => item.subcategory === subcategory);
            return categoryData.reduce((sum, item) => sum + (item[month] || 0), 0);
        });
        
        return {
            label: subcategory,
            data: monthlyData,
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace('0.8', '1'),
            borderWidth: 1
        };
    });
    
    // Filter out datasets with no data
    const filteredDatasets = datasets.filter(dataset => 
        dataset.data.some(value => value > 0)
    );
    
    return {
        labels: monthLabels,
        datasets: filteredDatasets
    };
}

function generateQuarterlyComparisonData(data) {
    // Filter data for Jalan (P.Jalan) - road cleaning services
    const jalanData = data.filter(item => 
        item.category === 'Pembayaran Perkhidmatan' && 
        (item.subcategory === 'Sapuan Jalan Perumahan' || item.subcategory === 'Sapuan Jalan Komersial')
    );
    
    if (jalanData.length === 0) {
        return { labels: [], datasets: [] };
    }
    
    const months = ['januari', 'februari', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const subcategories = [...new Set(jalanData.map(item => item.subcategory))];
    const colors = ['rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)'];
    
    const datasets = subcategories.map((subcategory, index) => {
        const monthlyData = months.map(month => {
            const categoryData = jalanData.filter(item => item.subcategory === subcategory);
            return categoryData.reduce((sum, item) => sum + (item[month] || 0), 0);
        });
        
        return {
            label: subcategory,
            data: monthlyData,
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace('0.8', '1'),
            borderWidth: 1
        };
    });
    
    return {
        labels: monthLabels,
        datasets: datasets
    };
}

function generateGrowthAnalysisData(data) {
    // Filter data for Longkang (P.Longkang) - drain cleaning services
    const longkangData = data.filter(item => 
        item.category === 'Pembayaran Perkhidmatan' && 
        (item.subcategory === 'Pembersihan Longkang Perumahan' || item.subcategory === 'Pembersihan Longkang Komersial')
    );
    
    if (longkangData.length === 0) {
        return { labels: [], datasets: [] };
    }
    
    const months = ['januari', 'februari', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const subcategories = [...new Set(longkangData.map(item => item.subcategory))];
    const colors = ['rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)'];
    
    const datasets = subcategories.map((subcategory, index) => {
        const monthlyData = months.map(month => {
            const categoryData = longkangData.filter(item => item.subcategory === subcategory);
            return categoryData.reduce((sum, item) => sum + (item[month] || 0), 0);
        });
        
        return {
            label: subcategory,
            data: monthlyData,
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace('0.8', '1'),
            borderWidth: 1,
            tension: 0.4
        };
    });
    
    return {
        labels: monthLabels,
        datasets: datasets
    };
}

function generateTopPerformersData(data) {
    // Filter data for Rumput (P.Rumput) - grass cutting services
    const rumputData = data.filter(item => 
        item.category === 'Pembayaran Perkhidmatan' && 
        item.subcategory === 'Pemotongan Rumput'
    );
    
    if (rumputData.length === 0) {
        return { labels: [], datasets: [] };
    }
    
    const months = ['januari', 'februari', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyData = months.map(month => {
        return rumputData.reduce((sum, item) => sum + (item[month] || 0), 0);
    });
    
    return {
        labels: monthLabels,
        datasets: [{
            label: 'Pemotongan Rumput (RM)',
            data: monthlyData,
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };
}

function generateSeasonalTrendsData(data) {
    // Filter data for Rumusan - Summary of Kutipan Sisa Pepejal and Pembersihan Awam
    const summaryData = data.filter(item => item.category === 'Summary PSPPA');
    
    if (summaryData.length === 0) {
        return { labels: [], datasets: [] };
    }
    
    const subcategories = [...new Set(summaryData.map(item => item.subcategory))];
    const colors = ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)'];
    
    return {
        labels: subcategories,
        datasets: [{
            data: subcategories.map(subcategory => {
                return summaryData
                    .filter(item => item.subcategory === subcategory)
                    .reduce((sum, item) => sum + item.total_amount, 0);
            }),
            backgroundColor: colors,
            borderWidth: 2
        }]
    };
}

function generateDistributionAnalysisData(data) {
    const scatterData = data.map(item => ({
        x: item.year,
        y: item.total_amount,
        category: item.category
    }));
    
    // Group by category for different colors
    const categories = [...new Set(data.map(item => item.category))];
    const datasets = categories.map((category, index) => ({
        label: category,
        data: scatterData.filter(point => point.category === category),
        backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.6)`,
        borderColor: `hsla(${index * 60}, 70%, 50%, 1)`,
        pointRadius: 5
    }));
    
    return { datasets };
}

// Apply filters to data
function applyFilters(data) {
    return data.filter(item => {
        if (currentFilters.year && item.year.toString() !== currentFilters.year) {
            return false;
        }
        if (currentFilters.category && item.category !== currentFilters.category) {
            return false;
        }
        if (currentFilters.month) {
            const monthNames = ['januari', 'februari', 'march', 'april', 'may', 'june',
                              'july', 'august', 'september', 'october', 'november', 'december'];
            const monthField = monthNames[parseInt(currentFilters.month) - 1];
            if (!item[monthField] || item[monthField] === 0) {
                return false;
            }
        }
        if (currentFilters.startDate && currentFilters.endDate) {
            const itemYear = item.year;
            const startYear = new Date(currentFilters.startDate).getFullYear();
            const endYear = new Date(currentFilters.endDate).getFullYear();
            if (itemYear < startYear || itemYear > endYear) {
                return false;
            }
        }
        return true;
    });
}

// Update all charts
async function updateAllCharts() {
    try {
        // Update filters from UI
        const yearFilter = document.getElementById('yearFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const monthFilter = document.getElementById('monthFilter');
        
        if (yearFilter) currentFilters.year = yearFilter.value;
        if (categoryFilter) currentFilters.category = categoryFilter.value;
        if (monthFilter) currentFilters.month = monthFilter.value;
        
        console.log('Updating charts with filters:', currentFilters);
        
        // Reload data with new filters
        await loadFinancialData();
        
        // Update each chart
        for (const config of dashboardConfig) {
            try {
                const chartData = generateChartData(config);
                createChart(config, chartData);
            } catch (error) {
                console.error(`Error updating chart ${config.id}:`, error);
            }
        }
        
        // Update summary stats
        await updateSummaryStats();
        
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Create or update chart
function createChart(config, chartData) {
    const ctx = document.getElementById(`chart-${config.id}`);
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts[config.id]) {
        charts[config.id].destroy();
    }
    
    // Special configuration for stacked charts
    const isStackedChart = ['subcategoryAnalysis', 'quarterlyComparison', 'growthAnalysis', 'topPerformers'].includes(config.id);
    
    const chartConfig = {
        type: config.type,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (typeof context.parsed.y !== 'undefined') {
                                return `${context.dataset.label}: RM ${context.parsed.y.toLocaleString()}`;
                            }
                            return `${context.label}: RM ${context.parsed.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: isStackedChart ? {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'RM ' + value.toLocaleString();
                        }
                    }
                }
            } : getScaleConfig(config.type),
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const elementIndex = elements[0].index;
                    const chartData = generateChartData(config);
                    showChartDetails(config, elementIndex, chartData);
                }
            }
        }
    };
    
    charts[config.id] = new Chart(ctx, chartConfig);
}

// Get scale configuration based on chart type
function getScaleConfig(type) {
    if (['doughnut', 'pie', 'radar', 'polarArea'].includes(type)) {
        return {};
    }
    
    if (type === 'scatter') {
        return {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Year'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Revenue (RM)'
                },
                ticks: {
                    callback: function(value) {
                        return 'RM ' + value.toLocaleString();
                    }
                }
            }
        };
    }
    
    return {
        y: {
            beginAtZero: true,
            ticks: {
                callback: function(value) {
                    return 'RM ' + value.toLocaleString();
                }
            }
        }
    };
}

// Update summary statistics
async function updateSummaryStats() {
    try {
        const filteredData = applyFilters(financialData);
        const totalRevenue = filteredData.reduce((sum, item) => sum + item.total_amount, 0);
        const totalRecords = filteredData.length;
        const activeCategories = [...new Set(filteredData.map(item => item.category))].length;
        
        // Calculate yearly growth
        const yearlyData = {};
        filteredData.forEach(item => {
            if (!yearlyData[item.year]) yearlyData[item.year] = 0;
            yearlyData[item.year] += item.total_amount;
        });
        
        const years = Object.keys(yearlyData).sort();
        let yearlyGrowth = 0;
        if (years.length > 1) {
            const currentYear = yearlyData[years[years.length - 1]];
            const previousYear = yearlyData[years[years.length - 2]];
            yearlyGrowth = ((currentYear - previousYear) / previousYear) * 100;
        }
        
        // Update UI elements if they exist
        const totalRevenueEl = document.getElementById('totalRevenue');
        const totalRecordsEl = document.getElementById('totalRecords');
        const activeCategoriesEl = document.getElementById('activeCategories');
        const yearlyGrowthEl = document.getElementById('yearlyGrowth');
        
        if (totalRevenueEl) totalRevenueEl.textContent = `RM ${totalRevenue.toLocaleString()}`;
        if (totalRecordsEl) totalRecordsEl.textContent = totalRecords.toLocaleString();
        if (activeCategoriesEl) activeCategoriesEl.textContent = activeCategories;
        if (yearlyGrowthEl) yearlyGrowthEl.textContent = `${yearlyGrowth.toFixed(1)}%`;
        
    } catch (error) {
        console.error('Error updating summary stats:', error);
    }
}

// Advanced chart interaction functions
function expandChart(chartId) {
    const config = dashboardConfig.find(c => c.id === chartId);
    if (!config) return;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'chartModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        width: 90%;
        height: 90%;
        border-radius: 8px;
        padding: 20px;
        position: relative;
        display: flex;
        flex-direction: column;
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>${config.title}</h2>
            <button onclick="closeExpandedChart()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            ">✕ Close</button>
        </div>
        <div style="flex: 1; position: relative;">
            <canvas id="expandedChart"></canvas>
        </div>
        <div id="chartDataTable" style="margin-top: 20px; max-height: 200px; overflow-y: auto;"></div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Create expanded chart
    setTimeout(() => {
        const ctx = document.getElementById('expandedChart');
        const chartData = generateChartData(config);
        
        const isStackedChart = ['subcategoryAnalysis', 'quarterlyComparison', 'growthAnalysis', 'topPerformers'].includes(config.id);
        
        const expandedChartInstance = new Chart(ctx, {
            type: config.type,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (typeof context.parsed.y !== 'undefined') {
                                    return `${context.dataset.label}: RM ${context.parsed.y.toLocaleString()}`;
                                }
                                return `${context.label}: RM ${context.parsed.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: isStackedChart ? {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'RM ' + value.toLocaleString();
                            }
                        }
                    }
                } : getScaleConfig(config.type),
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const elementIndex = elements[0].index;
                        showChartDetails(config, elementIndex, chartData);
                    }
                }
            }
        });
        
        // Store reference for cleanup
        window.expandedChartInstance = expandedChartInstance;
    }, 100);
}

function closeExpandedChart() {
    const modal = document.getElementById('chartModal');
    if (modal) {
        if (window.expandedChartInstance) {
            window.expandedChartInstance.destroy();
            window.expandedChartInstance = null;
        }
        modal.remove();
    }
}

function showChartDetails(config, elementIndex, chartData) {
    const tableContainer = document.getElementById('chartDataTable');
    if (!tableContainer) return;
    
    const filteredData = applyFilters(financialData);
    
    // Create detailed table based on the clicked element
    let tableHTML = '<h3>Detailed Data</h3><table style="width: 100%; border-collapse: collapse;">';
    tableHTML += '<thead><tr style="background: #f8f9fa;">';
    tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Month</th>';
    tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Category</th>';
    tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Subcategory</th>';
    tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Amount (RM)</th>';
    tableHTML += '<th style="border: 1px solid #ddd; padding: 8px;">Data Source</th>';
    tableHTML += '</tr></thead><tbody>';
    
    // Filter data based on clicked element and chart type
    let relevantData = filteredData;
    
    if (config.id === 'subcategoryAnalysis') {
        // For Pembersihan chart, show all pembersihan data for the clicked month
        const months = ['januari', 'februari', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
        const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        const selectedMonth = months[elementIndex];
        const selectedMonthLabel = monthLabels[elementIndex];
        
        relevantData = filteredData.filter(item => 
            item.category === 'Pembersihan' && item[selectedMonth] > 0
        );
        
        tableHTML += `<tr><td colspan="5" style="background: #e9ecef; font-weight: bold; padding: 10px;">
                      Data for ${selectedMonthLabel}</td></tr>`;
        
        relevantData.forEach(item => {
            tableHTML += `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${selectedMonthLabel}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.category}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.subcategory || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">RM ${(item[selectedMonth] || 0).toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.data_source || 'N/A'}</td>
            </tr>`;
        });
    } else if (config.id === 'categoryBreakdown' && chartData.labels[elementIndex]) {
        const selectedCategory = chartData.labels[elementIndex];
        relevantData = filteredData.filter(item => item.category === selectedCategory);
        
        relevantData.slice(0, 50).forEach(item => {
            tableHTML += `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;">All Year</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.category}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.subcategory || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">RM ${item.total_amount.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.data_source || 'N/A'}</td>
            </tr>`;
        });
    } else if (config.id === 'yearlyTrends' && chartData.labels[elementIndex]) {
        const selectedYear = chartData.labels[elementIndex];
        relevantData = filteredData.filter(item => item.year.toString() === selectedYear);
        
        relevantData.slice(0, 50).forEach(item => {
            tableHTML += `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${selectedYear}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.category}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.subcategory || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">RM ${item.total_amount.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.data_source || 'N/A'}</td>
            </tr>`;
        });
    }
    
    tableHTML += '</tbody></table>';
    
    if (relevantData.length > 50) {
        tableHTML += `<p><em>Showing first 50 of ${relevantData.length} records</em></p>`;
    }
    
    tableContainer.innerHTML = tableHTML;
}

// Enhanced PDF download function with data values
async function downloadChart(chartId) {
    try {
        // Check if jsPDF is available
        if (typeof window.jsPDF === 'undefined') {
            // Load jsPDF dynamically
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
        
        const chart = charts[chartId];
        const config = dashboardConfig.find(c => c.id === chartId);
        
        if (!chart || !config) {
            alert('Chart not found');
            return;
        }
        
        // Get chart data
        const chartData = generateChartData(config);
        const filteredData = applyFilters(financialData);
        
        // Create PDF
        const { jsPDF } = window.jsPDF;
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        
        // Add title
        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        pdf.text(config.title, 20, 20);
        
        // Add description
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(config.description, 20, 30);
        
        // Add chart image
        const chartImage = chart.toBase64Image();
        pdf.addImage(chartImage, 'PNG', 20, 40, 180, 100);
        
        // Add data table with values
        let startY = 150;
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Data Values:', 20, startY);
        
        // Create data table based on chart type
        startY += 10;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        if (config.id === 'subcategoryAnalysis') {
            // Pembersihan chart - show monthly breakdown by service type
            const tableData = [];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // Add header
            let headerRow = ['Service Type'];
            months.forEach(month => headerRow.push(month));
            headerRow.push('Total');
            tableData.push(headerRow);
            
            // Add data rows
            chartData.datasets.forEach(dataset => {
                let row = [dataset.label];
                let total = 0;
                dataset.data.forEach(value => {
                    row.push(`RM ${value.toLocaleString()}`);
                    total += value;
                });
                row.push(`RM ${total.toLocaleString()}`);
                tableData.push(row);
            });
            
            // Draw table
            drawPDFTable(pdf, tableData, 20, startY);
            
        } else if (config.id === 'monthlyPerformance') {
            // Monthly performance - show month by month values
            const tableData = [['Month', 'Revenue (RM)']];
            chartData.labels.forEach((label, index) => {
                const value = chartData.datasets[0].data[index];
                tableData.push([label, `RM ${value.toLocaleString()}`]);
            });
            
            drawPDFTable(pdf, tableData, 20, startY);
            
        } else if (config.id === 'categoryBreakdown') {
            // Category breakdown - show category totals
            const tableData = [['Category', 'Total Revenue (RM)', 'Percentage']];
            const total = chartData.datasets[0].data.reduce((sum, val) => sum + val, 0);
            
            chartData.labels.forEach((label, index) => {
                const value = chartData.datasets[0].data[index];
                const percentage = ((value / total) * 100).toFixed(1);
                tableData.push([label, `RM ${value.toLocaleString()}`, `${percentage}%`]);
            });
            
            // Add total row
            tableData.push(['TOTAL', `RM ${total.toLocaleString()}`, '100.0%']);
            
            drawPDFTable(pdf, tableData, 20, startY);
            
        } else if (config.id === 'yearlyTrends') {
            // Yearly trends - show year by year with growth
            const tableData = [['Year', 'Revenue (RM)', 'Growth %']];
            chartData.labels.forEach((label, index) => {
                const value = chartData.datasets[0].data[index];
                let growth = 'N/A';
                if (index > 0) {
                    const prevValue = chartData.datasets[0].data[index - 1];
                    growth = `${(((value - prevValue) / prevValue) * 100).toFixed(1)}%`;
                }
                tableData.push([label, `RM ${value.toLocaleString()}`, growth]);
            });
            
            drawPDFTable(pdf, tableData, 20, startY);
            
        } else {
            // Generic table for other charts
            const tableData = [['Label', 'Value (RM)']];
            
            if (chartData.datasets && chartData.datasets.length > 0) {
                if (chartData.labels) {
                    // Bar/Line charts with labels
                    chartData.labels.forEach((label, index) => {
                        chartData.datasets.forEach(dataset => {
                            const value = dataset.data[index] || 0;
                            tableData.push([`${label} (${dataset.label})`, `RM ${value.toLocaleString()}`]);
                        });
                    });
                } else {
                    // Scatter or other chart types
                    chartData.datasets.forEach(dataset => {
                        if (Array.isArray(dataset.data)) {
                            dataset.data.forEach((point, index) => {
                                const value = typeof point === 'object' ? point.y : point;
                                tableData.push([`${dataset.label} #${index + 1}`, `RM ${value.toLocaleString()}`]);
                            });
                        }
                    });
                }
            }
            
            drawPDFTable(pdf, tableData, 20, startY);
        }
        
        // Add summary statistics on a new page if needed
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('Summary Statistics', 20, 20);
        
        const totalRevenue = filteredData.reduce((sum, item) => sum + item.total_amount, 0);
        const recordCount = filteredData.length;
        const activeCategories = [...new Set(filteredData.map(item => item.category))].length;
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Total Revenue: RM ${totalRevenue.toLocaleString()}`, 20, 40);
        pdf.text(`Total Records: ${recordCount.toLocaleString()}`, 20, 50);
        pdf.text(`Active Categories: ${activeCategories}`, 20, 60);
        pdf.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 70);
        pdf.text(`Filters Applied:`, 20, 80);
        
        let filterY = 90;
        if (currentFilters.year) {
            pdf.text(`• Year: ${currentFilters.year}`, 30, filterY);
            filterY += 10;
        }
        if (currentFilters.category) {
            pdf.text(`• Category: ${currentFilters.category}`, 30, filterY);
            filterY += 10;
        }
        if (currentFilters.month) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            pdf.text(`• Month: ${monthNames[parseInt(currentFilters.month) - 1]}`, 30, filterY);
            filterY += 10;
        }
        if (currentFilters.startDate && currentFilters.endDate) {
            pdf.text(`• Date Range: ${currentFilters.startDate} to ${currentFilters.endDate}`, 30, filterY);
        }
        
        // Save PDF
        const fileName = `${config.title.replace(/\s+/g, '_')}_with_data_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Falling back to image download.');
        
        // Fallback to image download
        const chart = charts[chartId];
        if (chart) {
            const link = document.createElement('a');
            link.download = `${chartId}_chart.png`;
            link.href = chart.toBase64Image();
            link.click();
        }
    }
}

// Helper function to draw tables in PDF
function drawPDFTable(pdf, data, startX, startY) {
    const cellWidth = 35;
    const cellHeight = 8;
    const maxCols = Math.min(data[0].length, 7); // Limit columns to fit on page
    
    data.forEach((row, rowIndex) => {
        row.slice(0, maxCols).forEach((cell, colIndex) => {
            const x = startX + (colIndex * cellWidth);
            const y = startY + (rowIndex * cellHeight);
            
            // Draw cell border
            pdf.rect(x, y, cellWidth, cellHeight);
            
            // Add cell text
            pdf.setFontSize(8);
            if (rowIndex === 0) {
                pdf.setFont(undefined, 'bold');
            } else {
                pdf.setFont(undefined, 'normal');
            }
            
            // Truncate text if too long
            let cellText = cell.toString();
            if (cellText.length > 12) {
                cellText = cellText.substring(0, 9) + '...';
            }
            
            pdf.text(cellText, x + 2, y + 5);
        });
    });
}

// Enhanced date range filtering
function updateDateFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        currentFilters.startDate = startDate;
        currentFilters.endDate = endDate;
        updateAllCharts();
    }
}

function clearDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    currentFilters.startDate = '';
    currentFilters.endDate = '';
    updateAllCharts();
}

// Utility function to load external scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Chart interaction functions
function changeChartType(chartId, newType) {
    const config = dashboardConfig.find(c => c.id === chartId);
    if (config) {
        config.type = newType;
        const chartData = generateChartData(config);
        createChart(config, chartData);
    }
}

function closeDataModal() {
    const modal = document.getElementById('dataModal');
    if (modal) {
        modal.remove();
    }
}

function exportDashboardPDF() {
    alert('Dashboard PDF export feature coming soon!');
}

// Export functions for global access
window.updateAllCharts = updateAllCharts;
window.changeChartType = changeChartType;
window.expandChart = expandChart;
window.closeExpandedChart = closeExpandedChart;
window.downloadChart = downloadChart;
window.closeDataModal = closeDataModal;
window.exportDashboardPDF = exportDashboardPDF;
window.updateDateFilter = updateDateFilter;
window.clearDateFilter = clearDateFilter;

console.log('Dashboard script loaded successfully');
