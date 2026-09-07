import React, { createContext, useContext, useState } from 'react';

const ClusterContext = createContext(null);

const DEFAULT_CLUSTERS = [
  {
    id: 'cls-prod-us',
    name: 'Production Edge Gateway',
    region: 'US-East (N. Virginia)',
    clusterId: 'us-east-cluster-01',
    status: 'ACTIVE',
    activeRulesCount: 24,
    latencyMs: 42,
  },
  {
    id: 'cls-stage-eu',
    name: 'Staging VPC Ingress',
    region: 'EU-West (Frankfurt)',
    clusterId: 'eu-west-cluster-02',
    status: 'ACTIVE',
    activeRulesCount: 24,
    latencyMs: 38,
  },
  {
    id: 'cls-perimeter-ap',
    name: 'Internal DMZ Firewall',
    region: 'AP-South (Mumbai)',
    clusterId: 'ap-south-cluster-03',
    status: 'ACTIVE',
    activeRulesCount: 24,
    latencyMs: 56,
  },
];

export function ClusterProvider({ children }) {
  const [clusters, setClusters] = useState(DEFAULT_CLUSTERS);
  const [activeCluster, setActiveCluster] = useState(DEFAULT_CLUSTERS[0]);

  const switchCluster = (id) => {
    const cls = clusters.find((c) => c.id === id);
    if (cls) {
      setActiveCluster(cls);
    }
  };

  const addCluster = ({ name, region = 'US-West (Oregon)' }) => {
    const newCls = {
      id: 'cls-' + Math.random().toString(36).substring(2, 7),
      name,
      region,
      clusterId: region.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-node',
      status: 'ACTIVE',
      activeRulesCount: 24,
      latencyMs: 45,
    };
    setClusters((prev) => [...prev, newCls]);
    setActiveCluster(newCls);
    return newCls;
  };

  return (
    <ClusterContext.Provider
      value={{
        clusters,
        activeCluster,
        switchCluster,
        addCluster,
      }}
    >
      {children}
    </ClusterContext.Provider>
  );
}

export function useCluster() {
  const context = useContext(ClusterContext);
  if (!context) {
    throw new Error('useCluster must be used within a ClusterProvider');
  }
  return context;
}
