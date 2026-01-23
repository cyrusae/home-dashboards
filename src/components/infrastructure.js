/**
 * Infrastructure Status Component
 * Displays 3-node K3s cluster health as cards with conditional coloring
 * Fetches real data from Prometheus using nodename labels
 */

import { DashboardComponent } from '../components/base.js';

class InfrastructureStatus extends DashboardComponent {
  constructor() {
    super();
    // Node names in lowercase to match Prometheus labels
    this.nodes = ['babbage', 'epimetheus', 'kabandha'];
  }

  connectedCallback() {
    this.renderInitial();
    this.fetchStatus();
    // Refresh every 30 seconds
    this.updateInterval = setInterval(() => this.fetchStatus(), 30000);
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  renderInitial() {
    const html = `<div style="color: var(--text-light); font-style: italic; padding: 10px;">Loading cluster status...</div>`;
    this.setContent(html);
  }

  async fetchStatus() {
    try {
      const prometheusUrl = window.configManager.get('prometheusUrl');
      if (!prometheusUrl) {
        this.showError('Prometheus URL not configured');
        return;
      }

      // Fetch metrics for each node
      const nodeData = {};
      for (const node of this.nodes) {
        try {
          // Check if node is up using node_uname_info
          const upQuery = `up{job="node-exporter"} * on(instance) group_left(nodename) node_uname_info{nodename="${node}"}`;
          const upResponse = await fetch(`/api/prometheus/query?query=${encodeURIComponent(upQuery)}`);
          const upData = await upResponse.json();
          const isUp = upData.data?.result?.[0]?.value?.[1] === '1';

          if (!isUp) {
            nodeData[node] = { status: 'down', cpu: 0, memory: 0, pods: 0 };
            continue;
          }

          // Fetch CPU usage (100% - idle%)
          const cpuQuery = `100 - (avg by (nodename) (irate(node_cpu_seconds_total{mode="idle"}[5m]) * on(instance) group_left(nodename) node_uname_info{nodename="${node}"}) * 100)`;
          const cpuResponse = await fetch(`/api/prometheus/query?query=${encodeURIComponent(cpuQuery)}`);
          const cpuData = await cpuResponse.json();
          const cpu = Math.round(parseFloat(cpuData.data?.result?.[0]?.value?.[1] || 0));

          // Fetch memory usage
          const memQuery = `(1 - (node_memory_MemAvailable_bytes * on(instance) group_left(nodename) node_uname_info{nodename="${node}"} / (node_memory_MemTotal_bytes * on(instance) group_left(nodename) node_uname_info{nodename="${node}"}))) * 100`;
          const memResponse = await fetch(`/api/prometheus/query?query=${encodeURIComponent(memQuery)}`);
          const memData = await memResponse.json();
          const memory = Math.round(parseFloat(memData.data?.result?.[0]?.value?.[1] || 0));

          // Fetch running pods using kubelet_running_pods with node label
          const podsQuery = `kubelet_running_pods{node="${node}",job="kubelet"}`;
          const podsResponse = await fetch(`/api/prometheus/query?query=${encodeURIComponent(podsQuery)}`);
          const podsData = await podsResponse.json();
          const pods = Math.round(parseFloat(podsData.data?.result?.[0]?.value?.[1] || 0));

          nodeData[node] = {
            status: 'up',
            cpu: Math.max(0, Math.min(100, cpu)),
            memory: Math.max(0, Math.min(100, memory)),
            pods: pods,
          };
        } catch (e) {
          console.warn(`Failed to fetch metrics for ${node}:`, e);
          nodeData[node] = { status: 'error', cpu: 0, memory: 0, pods: 0 };
        }
      }

      this.renderStatus(nodeData);
    } catch (error) {
      console.error('Infrastructure status error:', error);
      this.showError(error.message);
    }
  }

  renderStatus(nodeData) {
    // Calculate cluster health
    const upCount = Object.values(nodeData).filter(n => n.status === 'up').length;
    const clusterHealth = this.getClusterHealth(upCount);

    const html = `
      <div class="infrastructure-grid">
        ${this.nodes.map(node => this.renderNodeCard(node, nodeData[node], clusterHealth)).join('')}
      </div>
    `;

    const styles = `
      .infrastructure-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        height: 100%;
      }

      .node-card {
        border: 2px solid;
        padding: 20px;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: all 0.3s ease;
      }

      .node-card.healthy {
        border-color: var(--accent-green);
        background: rgba(166, 209, 137, 0.1);
      }

      .node-card.warning {
        border-color: var(--accent-yellow);
        background: rgba(229, 200, 144, 0.1);
      }

      .node-card.critical {
        border-color: var(--accent-red);
        background: rgba(231, 130, 132, 0.1);
      }

      .node-name {
        font-weight: bold;
        font-size: var(--size-heading);
        color: var(--text-primary);
        text-transform: capitalize;
      }

      .node-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--size-body);
        font-weight: bold;
      }

      .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
      }

      .status-indicator.up {
        background: var(--accent-green);
      }

      .status-indicator.down {
        background: var(--accent-red);
      }

      .status-indicator.error {
        background: var(--accent-yellow);
      }

      .metric-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--size-body);
        padding: 6px 0;
      }

      .metric-label {
        color: var(--text-light);
        flex: 1;
      }

      .metric-value {
        color: var(--text-primary);
        font-weight: bold;
        min-width: 60px;
        text-align: right;
      }

      .metric-bar {
        width: 60px;
        height: 4px;
        background: var(--frappe-crust);
        border-radius: 2px;
        overflow: hidden;
        margin-left: 10px;
      }

      .metric-bar-fill {
        height: 100%;
        transition: background-color 0.3s ease;
      }

      .metric-bar-fill.normal {
        background: var(--accent-green);
      }

      .metric-bar-fill.warning {
        background: var(--accent-yellow);
      }

      .metric-bar-fill.critical {
        background: var(--accent-red);
      }

      @media (max-width: 1200px) {
        .infrastructure-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    this.setContent(html, styles);
  }

  renderNodeCard(nodeName, nodeData, clusterHealth) {
    const statusClass = this.getNodeStatusClass(nodeData);
    const statusColor = this.getStatusColor(nodeData.status);
    // Capitalize first letter for display
    const displayName = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);

    if (nodeData.status !== 'up') {
      return `
        <div class="node-card ${statusClass}">
          <div class="node-name">${displayName}</div>
          <div class="node-status">
            <span class="status-indicator ${nodeData.status}"></span>
            ${nodeData.status === 'down' ? 'Node Down' : 'Error'}
          </div>
        </div>
      `;
    }

    const cpuStatus = this.getMetricStatus(nodeData.cpu);
    const memStatus = this.getMetricStatus(nodeData.memory);

    return `
      <div class="node-card ${statusClass}">
        <div class="node-name">${displayName}</div>
        <div class="node-status">
          <span class="status-indicator ${nodeData.status}"></span>
          Online
        </div>
        <div class="metric-row">
          <span class="metric-label">CPU </span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="metric-value">${nodeData.cpu}%</span>
            <div class="metric-bar">
              <div class="metric-bar-fill ${cpuStatus}" style="width: ${Math.min(100, nodeData.cpu)}%"></div>
            </div>
          </div>
        </div>
        <div class="metric-row">
          <span class="metric-label">Memory </span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="metric-value">${nodeData.memory}%</span>
            <div class="metric-bar">
              <div class="metric-bar-fill ${memStatus}" style="width: ${Math.min(100, nodeData.memory)}%"></div>
            </div>
          </div>
        </div>
        <div class="metric-row">
          <span class="metric-label">Pods </span>
          <span class="metric-value">${nodeData.pods}</span>
        </div>
      </div>
    `;
  }

  getClusterHealth(upCount) {
    if (upCount === 3) return 'healthy';
    if (upCount === 2) return 'warning';
    return 'critical';
  }

  getNodeStatusClass(nodeData) {
    if (nodeData.status !== 'up') {
      return 'critical';
    }

    const cpu = nodeData.cpu;
    const memory = nodeData.memory;

    // Green: CPU <60% AND Memory <80%
    if (cpu < 60 && memory < 80) {
      return 'healthy';
    }

    // Yellow: CPU 60-85% OR Memory 80-95%
    if ((cpu >= 60 && cpu <= 85) || (memory >= 80 && memory <= 95)) {
      return 'warning';
    }

    // Red: CPU >85% OR Memory >95%
    return 'critical';
  }

  getMetricStatus(value) {
    if (value < 60) return 'normal';
    if (value < 85) return 'warning';
    return 'critical';
  }

  getStatusColor(status) {
    if (status === 'up') return 'var(--accent-green)';
    if (status === 'down') return 'var(--accent-red)';
    return 'var(--accent-yellow)';
  }
}

customElements.define('infrastructure-status', InfrastructureStatus);

export { InfrastructureStatus };