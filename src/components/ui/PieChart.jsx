import React, { createContext, useContext } from 'react';

const PieChartContext = createContext(null);
export const LegendItemContext = createContext(null);

const DigitReel = ({ value }) => {
  const digits = String(value).split('');

  return (
    <div className="inline-flex items-center justify-center select-none" style={{ height: '1.2em' }}>
      {digits.map((digit, idx) => {
        const isNum = !isNaN(parseInt(digit));
        if (!isNum) {
          return <span key={idx} className="font-black px-0.5">{digit}</span>;
        }
        
        const numVal = parseInt(digit);

        return (
          <div
            key={idx}
            className="relative inline-block overflow-hidden font-black"
            style={{ height: '1.2em', width: '0.6em', lineHeight: '1.2em' }}
          >
            <div
              className="flex flex-col"
              style={{
                transform: `translateY(-${numVal * 10}%)`,
                transition: 'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                height: '1000%'
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <div
                  key={n}
                  className="flex items-center justify-center font-black"
                  style={{ height: '10%' }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const getCoordinates = (cx, cy, radius, angle) => {
  return [
    cx + radius * Math.cos(angle),
    cy + radius * Math.sin(angle)
  ];
};

export const PieChart = ({
  data,
  hoveredIndex,
  onHoverChange,
  innerRadius = 55,
  size = 180,
  children
}) => {
  // Calculate total value of all slices
  const totalVal = data.reduce((sum, item) => sum + item.value, 0);

  const [animationProgress, setAnimationProgress] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp = null;
    const duration = 2000; // 2 seconds

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad

      setAnimationProgress(easedProgress);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [data]);

  // Pre-calculate segments to avoid state accumulation issues inside children
  let currentAngle = -Math.PI / 2; // start at 12 o'clock

  const slices = data.map((item, index) => {
    const value = item.value || 0;
    const percent = (totalVal > 0 ? value / totalVal : 0) * animationProgress;
    
    const angleStart = currentAngle;
    // For slices that represent almost 100%, offset slightly to ensure SVG renders properly
    const angleEnd = angleStart + percent * 2 * Math.PI - (percent > 0.999 ? 0.0001 : 0);
    currentAngle = angleStart + percent * 2 * Math.PI;

    const midAngle = (angleStart + angleEnd) / 2;

    return {
      ...item,
      index,
      percent,
      angleStart,
      angleEnd,
      midAngle
    };
  });

  // Partition children into SVG elements and overlay HTML elements
  const svgChildren = [];
  const htmlChildren = [];

  React.Children.forEach(children, child => {
    if (!child) return;
    if (child.type === PieSlice) {
      svgChildren.push(child);
    } else {
      htmlChildren.push(child);
    }
  });

  return (
    <PieChartContext.Provider
      value={{
        data,
        slices,
        hoveredIndex,
        onHoverChange,
        innerRadius,
        size,
        totalVal,
        animationProgress
      }}
    >
      <div 
        className="relative flex items-center justify-center animate-pie-chart"
        style={{ width: size, height: size }}
      >
        <svg 
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible select-none"
        >
          {totalVal === 0 ? (
            // Render a placeholder empty doughnut ring when data is 0 or empty
            <circle
              cx={size / 2}
              cy={size / 2}
              r={(size / 2 + innerRadius) / 2}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={(size / 2) - innerRadius}
              className="transition-all duration-300"
            />
          ) : (
            svgChildren
          )}
        </svg>
        {htmlChildren}
      </div>
    </PieChartContext.Provider>
  );
};

export const PieSlice = ({ index }) => {
  const context = useContext(PieChartContext);
  if (!context) {
    console.warn('PieSlice must be used within a PieChart component');
    return null;
  }

  const { slices, hoveredIndex, onHoverChange, size, innerRadius } = context;
  const slice = slices[index];

  if (!slice || slice.value === 0) {
    return null;
  }

  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2;
  const r = innerRadius;

  const { angleStart, angleEnd, midAngle, color } = slice;

  // Calculate arc path coordinates
  const [x1, y1] = getCoordinates(cx, cy, R, angleStart);
  const [x2, y2] = getCoordinates(cx, cy, R, angleEnd);
  const [x3, y3] = getCoordinates(cx, cy, r, angleEnd);
  const [x4, y4] = getCoordinates(cx, cy, r, angleStart);

  const largeArcFlag = (angleEnd - angleStart) > Math.PI ? 1 : 0;

  // Concentric doughnut slice path formula
  const pathData = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

  const isHovered = hoveredIndex === index;
  const isAnyHovered = hoveredIndex !== null;

  // Pop out effect: translate outward along midAngle and scale slightly
  const offset = isHovered ? 6 : 0;
  const dx = Math.cos(midAngle) * offset;
  const dy = Math.sin(midAngle) * offset;

  const style = {
    fill: color,
    stroke: '#FFFFFF',
    strokeWidth: size > 150 ? 4 : 3,
    strokeLinejoin: 'round',
    cursor: 'pointer',
    transformOrigin: 'center',
    transform: isHovered ? `translate(${dx}px, ${dy}px) scale(1.025)` : 'translate(0px, 0px) scale(1)',
    transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 350ms ease, filter 350ms ease',
    opacity: isAnyHovered && !isHovered ? 0.5 : 1,
    filter: isAnyHovered && !isHovered ? 'blur(1.2px)' : 'none',
  };

  return (
    <path
      d={pathData}
      style={style}
      className="origin-center"
      onMouseEnter={() => onHoverChange(index)}
      onMouseLeave={() => onHoverChange(null)}
    />
  );
};

export const PieCenter = ({ defaultLabel = 'Total' }) => {
  const context = useContext(PieChartContext);
  if (!context) return null;

  const { slices, hoveredIndex, size, totalVal, animationProgress = 1 } = context;

  let label = defaultLabel;
  let subLabel = `${totalVal}`;

  if (hoveredIndex !== null && slices[hoveredIndex]) {
    const active = slices[hoveredIndex];
    label = active.label;
    subLabel = `${active.value}`;
  } else {
    subLabel = `${Math.floor(totalVal * animationProgress)}`;
  }

  // Calculate inner container size based on innerRadius to prevent text overflow
  const padding = 10;
  const innerSize = context.innerRadius * 2 - padding;

  const isLarge = size > 200;
  const isMedium = size > 150;
  
  const valueClass = isLarge 
    ? "text-5xl font-black text-white tracking-tight" 
    : isMedium 
      ? "text-3xl font-black text-white" 
      : "text-xl font-black text-white";
      
  const labelClass = isLarge 
    ? "text-[12px] font-bold text-slate-400 tracking-widest mt-1.5 uppercase" 
    : isMedium 
      ? "text-[11px] font-semibold text-slate-450 tracking-wider mt-0.5 uppercase" 
      : "text-[9px] font-bold text-slate-400 tracking-wider mt-0.5 uppercase";

  return (
    <div
      className="absolute flex flex-col items-center justify-center pointer-events-none select-none text-center animate-in fade-in duration-200"
      style={{
        width: innerSize,
        height: innerSize,
        borderRadius: '50%',
      }}
    >
      <span className={`${valueClass} flex items-center justify-center px-1`}>
        <DigitReel value={subLabel} />
      </span>
      <span className={`${labelClass} transition-all duration-300 truncate max-w-full px-2`}>
        {label}
      </span>
    </div>
  );
};

export const Legend = ({
  items,
  hoveredIndex,
  onHoverChange,
  className = "flex-1 space-y-1.5 py-1 select-none",
  children
}) => {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <LegendItemContext.Provider
          key={index}
          value={{ item, index, hoveredIndex, onHoverChange }}
        >
          {children}
        </LegendItemContext.Provider>
      ))}
    </div>
  );
};

export const LegendItemComponent = ({ children }) => {
  const context = useContext(LegendItemContext);
  if (!context) {
    console.warn('LegendItemComponent must be used within a Legend component');
    return null;
  }

  const { index, hoveredIndex, onHoverChange } = context;
  const isHovered = hoveredIndex === index;
  const isAnyHovered = hoveredIndex !== null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
        isHovered ? 'bg-slate-100 shadow-sm scale-[1.02]' : 'hover:bg-slate-50/50'
      }`}
      style={{
        opacity: isAnyHovered && !isHovered ? 0.5 : 1
      }}
      onMouseEnter={() => onHoverChange(index)}
      onMouseLeave={() => onHoverChange(null)}
    >
      {children}
    </div>
  );
};

export const LegendMarker = () => {
  const context = useContext(LegendItemContext);
  if (!context) return null;

  const { item, index, hoveredIndex } = context;
  const isHovered = hoveredIndex === index;

  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200"
      style={{
        backgroundColor: item.color,
        transform: isHovered ? 'scale(1.25)' : 'scale(1)'
      }}
    />
  );
};

export const LegendLabel = () => {
  const context = useContext(LegendItemContext);
  if (!context) return null;

  const { item } = context;

  return (
    <span className="text-[11px] font-semibold text-slate-600">
      {item.label}
    </span>
  );
};