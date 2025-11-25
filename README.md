# 🚀 Telegram Mini App: Smart Inventory + QR POS System

A modern, feature-rich Point of Sale and Inventory Management system built as a Telegram Mini App. Designed for small businesses that need a simple, effective way to manage inventory and sales without complex backends.

![Built with React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)
![Vite](https://img.shields.io/badge/Vite-7-646cff)

## 🎯 Target Users

- Mini-marts / Kiosks
- Home businesses
- Small clothing stores
- Cafés & Restaurants
- Salons & Spas
- Mobile vendors
- Small grocery shops
- Mechanics & Electronics shops

**Perfect for businesses currently using pen & paper or WhatsApp to track inventory!**

## ✨ Features

### 📦 Product Management
- ✅ Add, edit, and delete products
- ✅ Auto QR code generation for each product
- ✅ Track cost price, sale price, and stock levels
- ✅ Category organization
- ✅ Low stock alerts
- ✅ Print QR codes for labeling

### 📷 QR Code Scanner
- ✅ Scan products using device camera
- ✅ Quick stock deduction
- ✅ Works inside Telegram Mini App
- ✅ Real-time inventory updates

### 🛒 POS Mode (Point of Sale)
- ✅ Multi-product cart management
- ✅ Scan to add items
- ✅ Auto-calculate totals and profit
- ✅ Apply discounts
- ✅ Generate digital receipts
- ✅ Print receipts
- ✅ Transaction history

### 📊 Sales Reports & Analytics
- ✅ Daily / Weekly / Monthly reports
- ✅ Revenue and profit tracking
- ✅ Best-selling products analysis
- ✅ Transaction history
- ✅ Export to Excel (.xlsx)
- ✅ Export to CSV

### 👥 Staff Management
- ✅ Add staff members
- ✅ Assign permissions
- ✅ Track who makes sales
- ✅ Owner and staff roles
- ✅ Staff-specific transaction logs

### 🔔 Smart Notifications
- ✅ Low stock alerts
- ✅ Customizable thresholds
- ✅ Visual indicators
- ✅ Alert management

### 💾 Backup & Restore
- ✅ Export all data as JSON
- ✅ Import data from backup
- ✅ Local data storage (IndexedDB)
- ✅ No cloud dependency

### 🎨 Beautiful UI
- ✅ Modern gradient design
- ✅ Smooth animations (Framer Motion)
- ✅ Mobile-optimized
- ✅ Responsive layout
- ✅ Dark mode compatible

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 3
- **State Management:** Zustand
- **Database:** IndexedDB (via idb)
- **Animations:** Framer Motion
- **QR Generation:** qrcode.react
- **QR Scanning:** html5-qrcode
- **Routing:** React Router DOM
- **Export:** SheetJS (xlsx), jsPDF
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Telegram SDK:** @twa-dev/sdk

## 📱 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- A code editor (VS Code recommended)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telegram-pos-app
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 🚀 Deployment

### Deploy to Telegram Mini App

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to your web server

3. Register your Mini App with BotFather:
   - Create a bot using [@BotFather](https://t.me/botfather)
   - Use `/newapp` command
   - Provide your web app URL

4. Test your Mini App in Telegram

### Deploy to Vercel/Netlify

The app can be deployed to any static hosting service:

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy
```

## 📖 User Guide

### Adding Products

1. Go to **Products** page
2. Click **Add Product** button
3. Fill in product details:
   - Name
   - Category (optional)
   - Cost Price
   - Sale Price
   - Stock Quantity
   - Low Stock Threshold
4. Click **Add Product**
5. QR code is automatically generated
6. Click QR icon to view/print the code

### Making a Sale (POS Mode)

1. Go to **POS** page
2. Click **Scan** button
3. Scan product QR codes or add manually
4. Adjust quantities if needed
5. Apply discount (optional)
6. Click **Complete Sale**
7. View/Print receipt

### Viewing Reports

1. Go to **Reports** page
2. Select period (Daily/Weekly/Monthly)
3. View revenue, profit, and top products
4. Export to Excel or CSV if needed

### Managing Staff

1. Go to **Staff** page
2. Add staff members with permissions
3. Set active staff member
4. All sales are tracked to the active staff

### Backup Data

1. Go to **Settings** page
2. Scroll to **Backup & Restore** section
3. Click **Export All Data** to download JSON
4. Store backup safely
5. Use **Import Data** to restore

## 🔒 Data Privacy

- ✅ All data stored locally on device (IndexedDB)
- ✅ No cloud storage or external servers
- ✅ No user tracking or analytics
- ✅ Full data ownership
- ✅ Export/Import for data portability

## ⚠️ Important Limitations

- **Single Device:** Data is stored on one device only
- **No Multi-Device Sync:** Use backup/restore to transfer
- **Camera Access:** Requires browser camera permissions
- **Local Storage:** Data lost if browser data cleared

## 🎨 Customization

### Change Theme Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    }
  }
}
```

### Modify Business Settings

In the app:
1. Go to Settings
2. Update Business Name, Currency, Tax Rate
3. Set custom receipt message

## 🐛 Troubleshooting

### Camera not working
- Check browser permissions
- Ensure HTTPS connection
- Try different browser

### QR codes not scanning
- Ensure good lighting
- Clean camera lens
- Try printing QR codes larger

### Data not saving
- Check browser IndexedDB support
- Clear browser cache and reload
- Export backup before clearing

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact developer

## 🙏 Acknowledgments

- Built with ❤️ for small business owners
- Inspired by real needs of local shops
- Thanks to the open-source community

---

**Made with 💜 for small businesses worldwide**
