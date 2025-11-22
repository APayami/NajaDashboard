# داشبورد پلیس - نقشه حرارتی جرایم و مسیرهای گشت

یک ماکت داشبورد فرانت‌اند برای نمایش داده‌های جرایم با نقشه حرارتی و محاسبه مسیرهای گشت.

Police Dashboard - Crime Heatmap & Patrol Routes (Persian/Farsi version for Tehran)

## ویژگی‌ها / Features

- **نقشه حرارتی جرایم**: نمایش تعاملی شدت جرایم در مناطق مختلف تهران
- **فیلتر مکانی**: فیلتر داده‌های جرمی بر اساس مناطق (مرکز شهر، شمال، جنوب، شرق، غرب تهران)
- **فیلتر زمانی**: فیلتر بر اساس بازه زمانی (۲۴ ساعت، ۷ روز، ۳۰ روز یا بازه دلخواه) و ساعت روز
- **محاسبه مسیر گشت**: وارد کردن تعداد گشت‌ها و تولید خودکار مسیرهای بهینه
- **نقشه تعاملی**: زوم، جابجایی و کاوش داده‌های جرایم روی نقشه تعاملی تهران

## Setup

This is a front-end only application using CDN libraries, so no build process is required.

### Quick Start

1. Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)

### Files Structure

```
PoliceDash/
├── index.html      # Main HTML structure
├── styles.css      # Dashboard styling
├── script.js       # Interactive functionality
└── README.md       # This file
```

## Usage

1. **View Crime Heatmap**: The heatmap automatically displays when you open the dashboard
2. **Apply Filters**: 
   - Select a location from the dropdown
   - Choose a time range
   - Optionally select a time of day filter
   - Click "Apply Filters"
3. **Calculate Patrol Routes**:
   - Enter the number of patrols (1-20)
   - Click "Calculate Routes"
   - Routes will appear on the map with different colors
   - Route information will display in the sidebar

## Technologies Used

- **Leaflet.js**: Interactive map library
- **Leaflet.heat**: Heatmap plugin for Leaflet
- **OpenStreetMap**: Map tiles provider
- **Vanilla JavaScript**: No framework dependencies

## Notes

- This is a **mockup/maquette** with mock data - no backend connection
- Default map center is set to New York City coordinates - adjust in `script.js` if needed
- Crime data is randomly generated for demonstration purposes
- Route calculation uses a grid-based clustering approach

## سفارشی‌سازی / Customization

نقشه به صورت پیش‌فرض روی تهران تنظیم شده است (مختصات: 35.6892° N, 51.3890° E). برای تغییر منطقه، مختصات را در `script.js` ویرایش کنید:

The map is set to Tehran by default (coordinates: 35.6892° N, 51.3890° E). To change the location, edit the coordinates in `script.js`:

```javascript
map = L.map('map').setView([LATITUDE, LONGITUDE], ZOOM_LEVEL);
```

برای افزودن مناطق بیشتر یا تغییر تولید داده‌های جرمی، شیء `districts` را در تابع `generateMockCrimeData()` ویرایش کنید.

To add more districts or modify crime data generation, edit the `districts` object in the `generateMockCrimeData()` function.

