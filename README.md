# Geospatial Foundation Models Explorer

An interactive web application for exploring cutting-edge foundation models in geospatial AI and Earth observation. Designed to help users go from zero knowledge to expert understanding of the major foundational models revolutionizing remote sensing.

## 🌍 Featured Models

### Google Earth AI
- **Vision-Language Models** with natural language query capabilities
- **Cross-modal reasoning** combining imagery with contextual data
- **Open-vocabulary object detection** for zero-shot identification
- Real-world applications in disaster response and environmental monitoring

### NASA Prithvi
- **Temporal Vision Transformer** pre-trained on 1TB+ satellite imagery
- **Multi-temporal analysis** for climate and environmental research
- **HLS dataset training** (Harmonized Landsat-Sentinel 2)
- Successfully used for flood mapping (Valencia floods case study)

### Clay Foundation Model
- **Multi-sensor compatibility** - works with any satellite sensor
- **Semantic embeddings** for similarity search and landscape understanding
- **Self-supervised learning** using Masked Autoencoder approach
- **Global landscape diversity** in training data

### SAM for Geospatial
- **Interactive segmentation** with point, box, or text prompts
- **Zero-shot capabilities** adapted from Meta's Segment Anything Model
- **Real-time processing** suitable for operational workflows
- **Building detection, field mapping**, and object delineation

## 🚀 Features

- **Comprehensive Model Coverage**: Deep dive into architecture, training, and capabilities
- **Interactive Comparisons**: Side-by-side comparison matrix of model strengths
- **Real-World Applications**: Practical use cases across environmental monitoring, urban planning, agriculture
- **Code Examples**: Implementation snippets and getting started guides
- **Visual Explanations**: Architecture diagrams and workflow illustrations

## 🛠 Technology Stack

- **React 18** with TypeScript for robust frontend development
- **React Router** for navigation between model pages
- **Lucide React** for consistent iconography
- **Vite** for fast development and building
- **Tailwind-inspired CSS** for modern, responsive design

## 📁 Project Structure

```
src/
├── components/
│   └── Layout.tsx          # Main navigation and app structure
├── pages/
│   ├── Home.tsx           # Overview of all models
│   ├── GoogleEarthAI.tsx  # Google Earth AI deep dive
│   ├── Prithvi.tsx        # NASA Prithvi analysis
│   ├── Clay.tsx           # Clay Foundation Model
│   ├── SAMGeo.tsx         # SAM for Geospatial
│   ├── Comparison.tsx     # Model comparison matrix
│   └── Applications.tsx   # Real-world use cases
├── App.tsx                # Main app component with routing
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## 🎯 Educational Objectives

This application is designed to:

1. **Demystify Foundation Models**: Explain complex AI architectures in accessible terms
2. **Compare Approaches**: Help users understand when to use which model
3. **Show Real Applications**: Bridge the gap between research and practical implementation
4. **Enable Exploration**: Interactive learning with detailed technical specifications
5. **Inspire Innovation**: Showcase the cutting-edge of geospatial AI

## 🌟 Key Insights Covered

- **Architecture Evolution**: From CNNs to Vision Transformers in remote sensing
- **Training Strategies**: Self-supervised learning, masked autoencoders, cross-modal training
- **Data Challenges**: Multi-spectral, temporal, and multi-sensor integration
- **Performance Metrics**: Benchmarks, improvements, and real-world validation
- **Future Directions**: Emerging trends in geospatial foundation models

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Access

- **Development**: http://localhost:3003
- **Remote Access**: http://100.68.227.27:3003 (via Tailscale)

## 📚 Learning Path

1. **Start with Overview** - Understand the landscape of foundation models
2. **Explore Individual Models** - Deep dive into each model's unique approach
3. **Compare Capabilities** - Understand strengths and use cases
4. **Study Applications** - See real-world implementations
5. **Try Examples** - Work through code snippets and workflows

## 🎓 Target Audience

- **Researchers** entering the geospatial AI field
- **Practitioners** looking to apply foundation models
- **Students** learning about cutting-edge remote sensing
- **Decision makers** evaluating AI solutions for Earth observation
- **Developers** implementing geospatial AI systems

This application provides a comprehensive introduction to the transformative world of geospatial foundation models, making complex research accessible and actionable.