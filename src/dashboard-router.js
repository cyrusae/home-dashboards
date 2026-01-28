/**
 * Dashboard Router
 * Routes to different dashboard layouts with automatic time-based switching
 * 
 * Schedule:
 * - 5:00 AM - 9:59 PM: morning dashboard
 * - 10:00 PM - 4:59 AM: night dashboard
 */

/**
 * Get the appropriate dashboard based on current PST time
 * @returns {string} Dashboard name ('morning' or 'night')
 */
function getDashboardForCurrentTime() {
  const now = new Date();
  
  // Get PST time
  const pstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const hour = pstTime.getHours();
  
  // 10 PM (22:00) to 4:59 AM (04:59) = night
  // 5 AM (05:00) to 9:59 PM (21:59) = morning
  if (hour >= 22 || hour < 5) {
    return 'night';
  } else {
    return 'morning';
  }
}

/**
 * Load a specific dashboard by name
 * @param {string} dashboardName - Name of dashboard to load
 */
async function loadDashboard(dashboardName) {
  const container = document.getElementById('app');
  container.innerHTML = '';

  // Import the appropriate dashboard layout
  try {
    let dashboardModule;
    
    switch (dashboardName) {
      case 'morning':
        dashboardModule = await import('./dashboards/morning/morning.js');
        break;
      case 'night':
        dashboardModule = await import('./dashboards/night/night.js');
        break;
      default:
        throw new Error(`Unknown dashboard: ${dashboardName}`);
    }

    // Create and mount the dashboard
    const dashboard = new dashboardModule.Dashboard();
    container.appendChild(dashboard);
    
    console.log(`✓ Loaded dashboard: ${dashboardName}`);
    
    // Return dashboard name for screensaver check
    return dashboardName;
    
  } catch (error) {
    console.error(`Failed to load dashboard: ${dashboardName}`, error);
    throw error;
  }
}

/**
 * Initialize dashboard routing with automatic time-based switching
 */
async function initializeDashboardRouter() {
  // Check if user specified a dashboard via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlDashboard = urlParams.get('dashboard');
  
  let dashboardName;
  
  if (urlDashboard && (urlDashboard === 'morning' || urlDashboard === 'night')) {
    // Use URL parameter if valid
    dashboardName = urlDashboard;
    console.log(`Using dashboard from URL: ${dashboardName}`);
  } else {
    // Auto-select based on time
    dashboardName = getDashboardForCurrentTime();
    console.log(`Auto-selected dashboard for current time: ${dashboardName}`);
  }
  
  // Load the dashboard
  await loadDashboard(dashboardName);
  
  // Set up automatic switching every minute
  // Check if we need to switch dashboards based on time
  setInterval(() => {
    const currentDashboard = urlParams.get('dashboard');
    
    // Only auto-switch if user didn't specify a dashboard in URL
    if (!currentDashboard) {
      const newDashboard = getDashboardForCurrentTime();
      const currentElement = document.querySelector('morning-dashboard, night-dashboard');
      const currentType = currentElement?.tagName.toLowerCase().replace('-dashboard', '');
      
      if (newDashboard !== currentType) {
        console.log(`Time-based switch: ${currentType} → ${newDashboard}`);
        loadDashboard(newDashboard);
      }
    }
  }, 60000); // Check every minute
  
  return dashboardName;
}

export { loadDashboard, initializeDashboardRouter, getDashboardForCurrentTime };