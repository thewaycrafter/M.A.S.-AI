'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styles from './AttackSurfaceMap.module.css';

interface Vulnerability {
    id: string;
    title: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    category: string;
    endpoint?: string;
}

interface Node extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    type: 'target' | 'endpoint' | 'vulnerability';
    severity?: string;
    data?: Vulnerability;
}

interface Link extends d3.SimulationLinkDatum<Node> {
    source: string | Node;
    target: string | Node;
}

interface AttackSurfaceMapProps {
    vulnerabilities: Vulnerability[];
    target: string;
}

export default function AttackSurfaceMap({ vulnerabilities, target }: AttackSurfaceMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    useEffect(() => {
        if (!svgRef.current || vulnerabilities.length === 0) return;

        // Clear previous visualization
        d3.select(svgRef.current).selectAll('*').remove();

        const width = 900;
        const height = 600;

        // Create nodes and links
        const nodes: Node[] = [];
        const links: Link[] = [];

        // Add target node (center)
        nodes.push({
            id: 'target',
            label: target,
            type: 'target',
        });

        // Group vulnerabilities by endpoint
        const endpointMap = new Map<string, Vulnerability[]>();
        vulnerabilities.forEach((vuln) => {
            const endpoint = vuln.endpoint || 'unknown';
            if (!endpointMap.has(endpoint)) {
                endpointMap.set(endpoint, []);
            }
            endpointMap.get(endpoint)!.push(vuln);
        });

        // Add endpoint nodes and vulnerability nodes
        endpointMap.forEach((vulns, endpoint) => {
            const endpointId = `endpoint-${endpoint}`;
            nodes.push({
                id: endpointId,
                label: endpoint,
                type: 'endpoint',
            });

            // Link endpoint to target
            links.push({
                source: 'target',
                target: endpointId,
            });

            // Add vulnerability nodes
            vulns.forEach((vuln, idx) => {
                const vulnId = `vuln-${endpoint}-${idx}`;
                nodes.push({
                    id: vulnId,
                    label: vuln.title,
                    type: 'vulnerability',
                    severity: vuln.severity,
                    data: vuln,
                });

                // Link vulnerability to endpoint
                links.push({
                    source: endpointId,
                    target: vulnId,
                });
            });
        });

        // Create SVG
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        // Add zoom behavior
        const g = svg.append('g');

        svg.call(
            d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.5, 3])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                })
        );

        // Create force simulation
        const simulation = d3
            .forceSimulation(nodes)
            .force('link', d3.forceLink<Node, Link>(links).id((d) => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));

        // Create links
        const link = g
            .append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('class', styles.link)
            .attr('stroke', '#00ff41')
            .attr('stroke-opacity', 0.3)
            .attr('stroke-width', 2);

        // Create nodes
        const node = g
            .append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', styles.node)
            .call(drag(simulation) as any);

        // Add circles to nodes
        node
            .append('circle')
            .attr('r', (d) => {
                if (d.type === 'target') return 25;
                if (d.type === 'endpoint') return 15;
                return 10;
            })
            .attr('fill', (d) => {
                if (d.type === 'target') return '#00ff41';
                if (d.type === 'endpoint') return '#00aaff';
                // Vulnerability colors by severity
                switch (d.severity) {
                    case 'Critical':
                        return '#ff0040';
                    case 'High':
                        return '#ff6b00';
                    case 'Medium':
                        return '#ffaa00';
                    case 'Low':
                        return '#ffd700';
                    default:
                        return '#888';
                }
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // Add labels
        node
            .append('text')
            .text((d) => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
            .attr('x', 0)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#00ff41')
            .attr('font-size', '12px')
            .attr('font-family', 'monospace');

        // Add click handler
        node.on('click', (event, d) => {
            event.stopPropagation();
            setSelectedNode(d);
        });

        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        });

        // Drag behavior
        function drag(simulation: d3.Simulation<Node, undefined>) {
            function dragstarted(event: any) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event: any) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event: any) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
        }

        // Cleanup
        return () => {
            simulation.stop();
        };
    }, [vulnerabilities, target]);

    return (
        <div className={styles.container}>
            <div className={styles.mapContainer}>
                <svg ref={svgRef} className={styles.svg}></svg>
            </div>

            {selectedNode && selectedNode.type === 'vulnerability' && selectedNode.data && (
                <div className={styles.detailPanel}>
                    <button className={styles.closeBtn} onClick={() => setSelectedNode(null)}>
                        ×
                    </button>
                    <h3>{selectedNode.data.title}</h3>
                    <div className={styles.severity} data-severity={selectedNode.data.severity.toLowerCase()}>
                        {selectedNode.data.severity}
                    </div>
                    <p><strong>Category:</strong> {selectedNode.data.category}</p>
                    {selectedNode.data.endpoint && (
                        <p><strong>Endpoint:</strong> {selectedNode.data.endpoint}</p>
                    )}
                </div>
            )}

            <div className={styles.legend}>
                <h4>Legend</h4>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#00ff41' }}></div>
                    <span>Target System</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#00aaff' }}></div>
                    <span>Endpoints</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#ff0040' }}></div>
                    <span>Critical</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#ff6b00' }}></div>
                    <span>High</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#ffaa00' }}></div>
                    <span>Medium</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ background: '#ffd700' }}></div>
                    <span>Low</span>
                </div>
            </div>

            <div className={styles.controls}>
                <p className={styles.hint}>💡 Drag nodes to rearrange • Scroll to zoom • Click vulnerabilities for details</p>
            </div>
        </div>
    );
}
