# Images Free Viewing Task - MouseView

Web-based psychological experiment using mouse spotlight to simulate eye tracking. Participants view emotional images while their attention patterns are tracked via mouse movements.

## Features

- **Mouse spotlight**: Dark overlay with transparent circle following cursor
- **20 main trials**: 12 image trials (4 emotional categories) + 8 neutral fillers
- **Practice phase**: Single trial with real images from stimulus set
- **Data export**: Trial data, mouse tracking, and heatmaps

## Quick Start (Local Dev)

1. **Start local server** (required for CORS):

   ```bash
   python3 -m http.server 8000
   # or: python -m SimpleHTTPServer 8000  (Python 2)
   # or: npx live-server
   ```

2. **Open**: `http://localhost:8000/`

3. **Flow**: Welcome → Participant Info → Practice → 20 Trials → Data Download

## Key Files

```
├── index.html              # Main experiment page
├── css/                    # Styling (experiment.css, mouseview.css)
├── js/                     # Core logic
│   ├── experiment.js       # Main controller
│   ├── image-manager.js    # Image handling & randomization
│   ├── data-manager.js     # Data collection & export
│   └── practice-manager.js # Practice trials
├── data/
│   └── stimuli-config.json # Experiment configuration
└── images/                 # Stimulus images (original/, filler/)
```

## How It Works

**Mouse Spotlight**: Dark overlay with transparent circle following mouse cursor simulates foveal vs peripheral vision (12% aperture, 85% opacity).

**Trial Structure**:

- 2s fixation cross → 15s image viewing → next trial
- 4 images per trial in screen corners (dysphoric, threat, positive, neutral)
- Random position assignment and filler trial interspersion

**Data Collection**:

- **Trial data**: Image assignments, positions, timing (matches PsychoPy format)
- **Mouse tracking**: High-frequency position data, movement analysis, quadrant times
- **Export**: CSV files + heatmap visualizations

## Controls & Configuration

**Keyboard**: SPACE (start/continue), ESC (emergency exit),

**Configuration** (`stimuli-config.json`): Modify image sets, trial count, timing parameters

**Settings** (`experiment.js`):

```javascript
imageViewingTime: 15000,    // Auto-advance time (ms)
enableMouseTracking: true   // Mouse data collection
```

## Data Export

Automatic downloads:

- `trial_data_[ID]_[timestamp].csv` - Trial results
- `mouse_data_[ID]_[timestamp].csv` - Mouse tracking

Non-Automatic download

- `trial_heatmaps_[ID]_[timestamp].zip` - Individual trial heatmaps

## Troubleshooting

**Images not loading**: Use local server (`python3 -m http.server 8000`), check image paths in `images/original/` and `images/filler/`

**Data not downloading**: Click download buttons manually, check Downloads folder
