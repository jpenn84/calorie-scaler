# Calorie Scaler

Calorie Scaler is a fast, responsive food portion calorie calculator. It helps you quickly convert and scale nutrition label calories to your actual serving size across different units (grams, ounces, cups, tablespoons, etc.).

## Features
- **Smart Unit Conversion:** Seamlessly convert between metric and imperial units (e.g., grams to ounces, milliliters to cups).
- **Responsive UI:** Built with Tailwind CSS for an optimized, app-like mobile and desktop experience.
- **Installable PWA:** Works offline and can be installed directly to your home screen as a Progressive Web App.
- **Fully Accessible:** Engineered for inclusivity with a perfect 100/100 Lighthouse Accessibility score, ensuring compatibility with screen readers and high contrast requirements.
- **Lightning Fast:** Powered by Svelte and Vite for instant interactivity.

## Getting Started

### Prerequisites
- Node.js (version 18+ recommended)
- npm

### Installation
1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the Vite development server:
```bash
npm run dev
```

### Building for Production
Create a production-ready build in the `dist` folder:
```bash
npm run build
```

### Testing
This project uses Playwright for end-to-end and accessibility testing. To run the tests:
```bash
npm run test
```
To view the HTML report of the test results:
```bash
npx playwright show-report
```

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](LICENSE) file for details.
