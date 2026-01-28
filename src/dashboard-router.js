/**
 * Dashboard Router
 * Routes to different dashboard layouts (morning, afternoon, evening, tv)
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
      case 'afternoon':
        dashboardModule = await import('./dashboards/afternoon.js');
        break;
      case 'evening':
        dashboardModule = await import('./dashboards/evening.js');
        break;
      case 'night':
        dashboardModule = await import('./dashboards/night/night.js');
        break;
      case 'tv':
        dashboardModule = await import('./dashboards/tv.js');
        break;
      default:
        throw new Error(`Unknown dashboard: ${dashboardName}`);
    }

    // Create and mount the dashboard
    const dashboard = new dashboardModule.Dashboard();
    container.appendChild(dashboard);
    
  } catch (error) {
    console.error(`Failed to load dashboard: ${dashboardName}`, error);
    throw error;
  }
}

export { loadDashboard };