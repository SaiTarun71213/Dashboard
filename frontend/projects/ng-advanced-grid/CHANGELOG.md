# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-06-18

### Added
- Initial release of NgAdvancedGrid
- Drag and drop functionality with collision detection
- 8-direction resize handles with constraints
- Responsive breakpoint system
- Auto-layout and compacting algorithms
- Touch support for mobile devices
- Smooth animations and transitions
- TypeScript support with full type definitions
- Comprehensive API for programmatic control
- Grid utilities service for calculations
- Grid engine service for state management
- Customizable grid configuration
- Item templates with content projection
- Layout persistence (export/import)
- Real-time layout updates
- Performance optimizations for large grids
- Extensive documentation and examples

### Features
- **Core Grid System**
  - Configurable columns and cell height
  - Margin and gap control
  - Grid background visualization
  - Auto-resize on container changes

- **Drag & Drop**
  - Smooth dragging with visual feedback
  - Collision detection and prevention
  - Smart positioning algorithms
  - Push and swap item behaviors
  - Drag handle support

- **Resize System**
  - 8-direction resize handles (N, S, E, W, NE, NW, SE, SW)
  - Min/max width and height constraints
  - Real-time resize feedback
  - Grid-aligned resizing

- **Layout Management**
  - Vertical and horizontal compacting
  - Auto-positioning for new items
  - Layout validation and correction
  - Fixed item support

- **Responsive Design**
  - Breakpoint-based column adjustment
  - Mobile-friendly touch interactions
  - Adaptive layouts

- **Developer Experience**
  - Full TypeScript support
  - Comprehensive API
  - Event system for layout changes
  - Easy integration with Angular applications
  - Standalone components support

### Technical Details
- Built with Angular 17+
- Uses RxJS for reactive state management
- Optimized change detection strategy
- Memory leak prevention
- Cross-browser compatibility
- Accessibility considerations

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Dependencies
- Angular 17+
- RxJS 7+
- TypeScript 5+

### Bundle Size
- ~100KB (minified + gzipped)
- Tree-shakeable
- No external dependencies beyond Angular
