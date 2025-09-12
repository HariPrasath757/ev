# **App Name**: EvolveNet Manager

## Core Features:

- Authentication: Secure login system with 3 pre-defined user accounts. Displays 'Invalid credentials' on wrong input.
- Station Data Display: Fetch and display real-time charging station data (name, status, wait time, location, ports, price, trust score).
- Real-time Updates: Reflect changes in station data (status, availablePorts, queue) without page refresh.
- Queue Management: Show real-time driver queue for occupied stations. Update queue when stations are available.
- Issue Reporting: Enable users to report station issues. Save to `/reports` with relevant details. Infer severity from report details with an AI tool.

## Style Guidelines:

- Primary color: Electric blue (#7DF9FF) evokes technology and energy.
- Background color: Dark gray (#2E2E2E) provides contrast for the vibrant primary color and a modern feel.
- Accent color: Bright Green (#00FF00) will call attention to available charging ports, ok statuses and interactive elements.
- Font: 'Inter', a grotesque-style sans-serif, will be used for all headlines and body text, providing a modern and neutral appearance.
- Use simple, minimalist icons to represent station status and report types.
- Clean, card-based layout for stations. Clear visual separation for each data point.