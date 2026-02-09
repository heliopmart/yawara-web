"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from './TeamConstellation.module.scss';

interface Member {
  name: string;
  role: string;
}

interface MemberNode extends Member {
  x: number;
  y: number;
}

interface ConstellationProps {
  members: Member[];
}

const TeamConstellation: React.FC<ConstellationProps> = ({ members }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<MemberNode[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (isMobile) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const MIN_NODE_DISTANCE = 120;
    const NEON_COLOR_RGB = '255, 0, 0';

    const initNodes = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const newNodes: MemberNode[] = [];

      members.forEach((member) => {
        let attempts = 0;
        let pos = { x: 0, y: 0 };
        let overlapping = true;

        while (overlapping && attempts < 50) {
          pos = {
            x: Math.random() * (canvas.width - 120) + 60,
            y: Math.random() * (canvas.height - 80) + 40
          };
          overlapping = newNodes.some(node =>
            Math.sqrt((pos.x - node.x) ** 2 + (pos.y - node.y) ** 2) < MIN_NODE_DISTANCE
          );
          attempts++;
        }
        newNodes.push({ ...member, x: pos.x, y: pos.y });
      });
      nodesRef.current = newNodes;
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.font = '500 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';

      nodesRef.current.forEach((node) => {
        const dx = mouseRef.current.x - node.x;
        const dy = mouseRef.current.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          const opacity = 1 - distance / 200;
          ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgba(${NEON_COLOR_RGB}, 0.8)`;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });

      nodesRef.current.forEach((node) => {
        ctx.fillStyle = 'white';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + 5);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '400 11px Inter, sans-serif';
       ctx.fillText(node.role, node.x, node.y + 20);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    initNodes();
    render();

    return () => {
      window.removeEventListener('resize', checkMobile);
      cancelAnimationFrame(animationFrameId);
    };
  }, [members, isMobile]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div
      ref={containerRef}
      className={isMobile ? styles.mobileGrid : styles.desktopContainer}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => mouseRef.current = { x: -9999, y: -9999 }}
    >
      {isMobile ? (
        members.map((m, i) => (
          <div key={i} className={styles.memberCard}>
            <span className={styles.name}>{m.name}</span>
            <span className={styles.role}>{m.role}</span>
          </div>
        ))
      ) : (
        <>
          <div className={styles.seoHidden}>
            {members.map((m, i) => <div key={i}>{m.name}</div>)}
          </div>
          <canvas ref={canvasRef} className={styles.canvas} />
        </>
      )}
    </div>
  );
};

export default TeamConstellation;