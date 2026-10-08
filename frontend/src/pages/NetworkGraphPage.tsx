import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Info,
  Download,
  Camera
} from 'lucide-react';
import { Case } from '../types';
import { api } from '../services/api';

interface NetworkGraphPageProps {
  cases: Case[];
  activeCaseId: string;
  onSelectEntityDossier: (entityId: string) => void;
  selectedEntityId?: string;
}

const COLOR_LEGEND = [
  { type: 'Person', color: '#0091B9', label: 'Person' },
  { type: 'Phone', color: '#004E9B', label: 'Phone' },
  { type: 'Vehicle', color: '#FF6500', label: 'Vehicle' },
  { type: 'Location', color: '#FFD500', label: 'Location' },
  { type: 'Transaction', color: '#004E9B', label: 'Transaction' },
  { type: 'Organization', color: '#BAE4F0', label: 'Organization' },
];

export const NetworkGraphPage: React.FC<NetworkGraphPageProps> = ({
  cases,
  activeCaseId,
  onSelectEntityDossier,
  selectedEntityId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(activeCaseId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [layoutName, setLayoutName] = useState('cose');

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getGraph(selectedCase || undefined);
      setGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [selectedCase]);

  // Initialize or update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.elements) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: graphData.elements,
      style: ([
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'font-weight': 600,
            'color': '#1E293B',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-opacity': 0.85,
            'text-background-color': '#FFFFFF',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'width': 'data(size)',
            'height': 'data(size)',
            'border-width': 2,
            'border-color': '#FFFFFF',
            'shadow-blur': 6,
            'shadow-color': 'rgba(0,0,0,0.12)',
            'shadow-opacity': 0.8
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94A3B8',
            'target-arrow-color': '#94A3B8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'font-family': 'Inter, sans-serif',
            'color': '#64748B',
            'text-rotation': 'autorotate',
            'text-background-opacity': 0.8,
            'text-background-color': '#FFFFFF',
            'text-background-padding': '2px'
          }
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#FF6500',
            'shadow-color': '#FF6500',
            'shadow-blur': 12
          }
        },
        {
          selector: '.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#004E9B'
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.2
          }
        }
      ] as any),
      layout: {
        name: layoutName as any,
        animate: false,
        padding: 50
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeId = node.id();

      // Highlight neighborhood and dim rest
      cy.elements().removeClass('highlighted dimmed');
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass('dimmed');
      node.addClass('highlighted');

      // Trigger entity dossier
      onSelectEntityDossier(nodeId);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted dimmed');
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData, layoutName]);

  // Handle Search Filtering on Canvas
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    if (!searchTerm.trim() && typeFilter === 'ALL') {
      cy.elements().removeClass('dimmed highlighted');
      return;
    }

    cy.elements().addClass('dimmed');

    const matched = cy.nodes().filter((node) => {
      const label = (node.data('label') || '').toLowerCase();
      const type = node.data('type');
      const matchesSearch = !searchTerm || label.includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || type === typeFilter;
      return matchesSearch && matchesType;
    });

    matched.removeClass('dimmed').addClass('highlighted');
    matched.connectedEdges().removeClass('dimmed');
  }, [searchTerm, typeFilter]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 50);
  const handleReset = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    cyRef.current?.elements().removeClass('dimmed highlighted');
    cyRef.current?.fit(undefined, 50);
  };

  const handleExportPNG = () => {
    if (!cyRef.current) return;
    try {
      const pngUri = cyRef.current.png({ bg: '#FFFFFF', full: true, scale: 2 });
      const a = document.createElement('a');
      a.href = pngUri;
      a.download = `network_topology_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('PNG export failed', err);
    }
  };

  const handleExportJSON = () => {
    if (!graphData) return;
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network_graph_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#BAE4F0]/60 flex items-center justify-center text-[#004E9B]">
            <Share2 className="w-4 h-4 text-[#0091B9]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#004E9B]">
              Topological Network Graph
            </h1>
            <p className="text-[11px] text-slate-500">
              NetworkX centrality metrics & Cytoscape relational visualization
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Node */}
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Entity Types</option>
            <option value="Person">Person</option>
            <option value="Phone">Phone</option>
            <option value="Vehicle">Vehicle</option>
            <option value="Location">Location</option>
            <option value="Transaction">Transaction</option>
          </select>

          {/* Case Scope */}
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-semibold"
          >
            <option value="">Global Network (All Cases)</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_code}
              </option>
            ))}
          </select>

          {/* Layout Toggle */}
          <select
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700"
          >
            <option value="cose">Force-Directed (CoSE)</option>
            <option value="concentric">Concentric Centrality</option>
            <option value="circle">Circular Ring</option>
            <option value="breadthfirst">Hierarchical Tree</option>
          </select>
        </div>
      </div>

      {/* Main Canvas Card */}
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[620px]">
        {/* Floating Zoom & Canvas Controls */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <button
            onClick={handleFit}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <button
            onClick={handleExportPNG}
            className="p-1.5 rounded hover:bg-slate-100 text-[#0091B9] transition-colors"
            title="Export High-Res Graph Image (PNG)"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportJSON}
            className="p-1.5 rounded hover:bg-slate-100 text-[#004E9B] transition-colors"
            title="Export Topology Data (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Topological Metrics Pill */}
        {graphData?.metrics && (
          <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm text-xs flex items-center space-x-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">NODES</span>
              <span className="font-bold text-slate-800">{graphData.metrics.total_nodes}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">EDGES</span>
              <span className="font-bold text-slate-800">{graphData.metrics.total_edges}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">AVG DEGREE</span>
              <span className="font-bold text-[#0091B9]">{graphData.metrics.average_degree}</span>
            </div>
          </div>
        )}

        {/* The Cytoscape Container */}
        <div ref={containerRef} className="w-full h-full bg-[#FAFAFA]" />

        {/* Floating Color Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Legend:
          </span>
          {COLOR_LEGEND.map((item) => (
            <div key={item.type} className="flex items-center space-x-1.5">
              <span
                className="w-3 h-3 rounded-full border border-slate-200"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-medium text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
