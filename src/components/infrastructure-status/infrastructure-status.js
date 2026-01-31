/**
 * Infrastructure Status Component
 * Displays 3-node K3s cluster health as cards with conditional coloring
 * Fetches real data from Prometheus using nodename labels
 * Enhanced with network resilience
 */

import { DashboardComponent } from '../base.js';
import html from './infrastructure-status.html?raw';
import styles from './infrastructure-status.css?raw';

class InfrastructureStatus extends DashboardComponent {
  constructor() {
    super();
    // Node names in lowercase to match Prometheus labels
    this.nodes = ['babbage', 'epimetheus', 'kabandha'];
    this.updateInterval = null;
    this.lastSuccessfulData = null;
  }

  connectedCallback() {
    this.setContent(html, styles);
    this.fetchStatus();
    // Refresh every 30 seconds
    this.updateInterval = setInterval(() => this.fetchStatus(), 30000);
  }

  disconnectedCallback() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async fetchStatus() {
    try {
      const prometheusUrl = window.configManager?.get('prometheusUrl');
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
          const upResponse = await this.fetchWithRetry(
            `/api/prometheus/query?query=${encodeURIComponent(upQuery)}`,
            {},
            0 // Start with 0 retries for faster failures per-node
          );
          const upData = await upResponse.json();
          const isUp = upData.data?.result?.[0]?.value?.[1] === '1';

          if (!isUp) {
            nodeData[node] = { status: 'down', cpu: 0, memory: 0, pods: 0 };
            continue;
          }

          // Fetch CPU usage (100% - idle%)
          const cpuQuery = `100 - (avg by (nodename) (irate(node_cpu_seconds_total{mode="idle"}[5m]) * on(instance) group_left(nodename) node_uname_info{nodename="${node}"}) * 100)`;
          const cpuResponse = await this.fetchWithRetry(
            `/api/prometheus/query?query=${encodeURIComponent(cpuQuery)}`,
            {},
            0
          );
          const cpuData = await cpuResponse.json();
          const cpu = Math.round(parseFloat(cpuData.data?.result?.[0]?.value?.[1] || 0));

          // Fetch memory usage
          const memQuery = `(1 - (node_memory_MemAvailable_bytes * on(instance) group_left(nodename) node_uname_info{nodename="${node}"} / (node_memory_MemTotal_bytes * on(instance) group_left(nodename) node_uname_info{nodename="${node}"}))) * 100`;
          const memResponse = await this.fetchWithRetry(
            `/api/prometheus/query?query=${encodeURIComponent(memQuery)}`,
            {},
            0
          );
          const memData = await memResponse.json();
          const memory = Math.round(parseFloat(memData.data?.result?.[0]?.value?.[1] || 0));

          // Fetch running pods using kubelet_running_pods with node label
          const podsQuery = `kubelet_running_pods{node="${node}",job="kubelet"}`;
          const podsResponse = await this.fetchWithRetry(
            `/api/prometheus/query?query=${encodeURIComponent(podsQuery)}`,
            {},
            0
          );
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

      // Cache successful data
      this.lastSuccessfulData = nodeData;
      
      this.updateGrid(nodeData);
      
    } catch (error) {
      console.error('Infrastructure status error:', error);
      
      // Try cached data
      if (this.lastSuccessfulData) {
        console.log('Using cached infrastructure data');
        this.updateGrid(this.lastSuccessfulData);
        this.showTransientError('Using cached cluster data (connection issue)');
      } else {
        this.showError(`Infrastructure unavailable: ${error.message}`);
      }
    }
  }

  updateGrid(nodeData) {
    const grid = this.query('#infrastructureGrid');
    
    if (!grid) {
      console.error('Infrastructure grid not found');
      return;
    }
    
    try {
      grid.innerHTML = '';

      // Clone and populate template for each node
      this.nodes.forEach(node => {
        const card = this.createNodeCard(node, nodeData[node]);
        if (card) {
          grid.appendChild(card);
        }
      });
    } catch (error) {
      console.error('Error updating infrastructure grid:', error);
    }
  }

  createNodeCard(nodeName, nodeData) {
    try {
      const displayName = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);
      const statusClass = this.getNodeStatusClass(nodeData);

      // Handle down/error nodes
      if (nodeData.status !== 'up') {
        const template = this.query('#nodeDownTemplate');
        if (!template) {
          console.error('Node down template not found');
          return null;
        }
        
        const card = template.content.cloneNode(true);
        
        const cardElement = card.querySelector('.node-card');
        if (cardElement) cardElement.classList.add(statusClass);
        
        const nameEl = card.querySelector('[data-node-name]');
        const statusClassEl = card.querySelector('[data-status-class]');
        const statusTextEl = card.querySelector('[data-status-text]');
        
        if (nameEl) nameEl.textContent = displayName;
        if (statusClassEl) statusClassEl.classList.add(nodeData.status);
        if (statusTextEl) statusTextEl.textContent = nodeData.status === 'down' ? 'Node Down' : 'Error';
        
        return card;
      }

      // Handle up nodes
      const template = this.query('#nodeUpTemplate');
      if (!template) {
        console.error('Node up template not found');
        return null;
      }
      
      const card = template.content.cloneNode(true);
      
      const cardElement = card.querySelector('.node-card');
      if (cardElement) cardElement.classList.add(statusClass);
      
      const nameEl = card.querySelector('[data-node-name]');
      if (nameEl) nameEl.textContent = displayName;
      
      // CPU metrics
      const cpuStatus = this.getMetricStatus(nodeData.cpu);
      const cpuValueEl = card.querySelector('[data-cpu-value]');
      const cpuBarEl = card.querySelector('[data-cpu-bar]');
      
      if (cpuValueEl) cpuValueEl.textContent = `${nodeData.cpu}%`;
      if (cpuBarEl) {
        cpuBarEl.classList.add(cpuStatus);
        cpuBarEl.style.width = `${Math.min(100, nodeData.cpu)}%`;
      }
      
      // Memory metrics
      const memStatus = this.getMetricStatus(nodeData.memory);
      const memValueEl = card.querySelector('[data-memory-value]');
      const memBarEl = card.querySelector('[data-memory-bar]');
      
      if (memValueEl) memValueEl.textContent = `${nodeData.memory}%`;
      if (memBarEl) {
        memBarEl.classList.add(memStatus);
        memBarEl.style.width = `${Math.min(100, nodeData.memory)}%`;
      }
      
      // Pods
      const podsValueEl = card.querySelector('[data-pods-value]');
      if (podsValueEl) podsValueEl.textContent = nodeData.pods;
      
      return card;
    } catch (error) {
      console.error('Error creating node card:', error);
      return null;
    }
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
}

customElements.define('infrastructure-status', InfrastructureStatus);

export { InfrastructureStatus };