export const googleProfileMock = {
  profile: {
    id: "belgians-waffle",
    name: "belgians waffle",
    category: "Dessert Shop",
    location: "Boisar, Maharashtra",
    status: "Ready for Google connection",
    completeness: 72,
    completenessClass: "w-[72%]",
  },
  metrics: [
    { id: "views", label: "Profile Views", value: "0", trend: "No live data", tone: "blue" },
    { id: "rating", label: "Average Rating", value: "0.0", trend: "Awaiting reviews", tone: "amber" },
    { id: "reviews", label: "Review Count", value: "0", trend: "No synced reviews", tone: "emerald" },
    { id: "calls", label: "Calls", value: "0", trend: "Not connected", tone: "rose" },
    { id: "directions", label: "Directions", value: "0", trend: "Not connected", tone: "cyan" },
  ],
  performance: {
    labels: ["Jul 12", "Jul 16", "Jul 20", "Jul 24", "Jul 28", "Aug 1", "Aug 5", "Aug 9"],
    series: [
      { label: "Visibility", value: 24, widthClass: "w-[24%]" },
      { label: "Search Discovery", value: 38, widthClass: "w-[38%]" },
      { label: "Calls", value: 12, widthClass: "w-[12%]" },
      { label: "Directions", value: 18, widthClass: "w-[18%]" },
    ],
    barHeights: ["h-5", "h-10", "h-16", "h-24", "h-5", "h-10", "h-16", "h-24"],
  },
  reputation: {
    averageRating: 0,
    totalReviews: 0,
    distribution: [
      { stars: 5, count: 0, widthClass: "w-0" },
      { stars: 4, count: 0, widthClass: "w-0" },
      { stars: 3, count: 0, widthClass: "w-0" },
      { stars: 2, count: 0, widthClass: "w-0" },
      { stars: 1, count: 0, widthClass: "w-0" },
    ],
  },
  reviews: [
    {
      id: "review-1",
      reviewer: "Amit Shah",
      rating: 5,
      date: "10 Aug 2026",
      text: "Clean store and quick service. Looking forward to ordering again.",
      replied: false,
    },
    {
      id: "review-2",
      reviewer: "Neha Patil",
      rating: 4,
      date: "8 Aug 2026",
      text: "Good experience. Product photos helped me find the location faster.",
      replied: true,
    },
  ],
  photos: [
    { id: "photo-1", title: "Store front", type: "Exterior", status: "Ready" },
    { id: "photo-2", title: "Popular product", type: "Product", status: "Draft" },
    { id: "photo-3", title: "Counter area", type: "Interior", status: "Ready" },
  ],
  qr: {
    businessName: "belgians waffle",
    reviewLink: "Google review link will appear after connection",
  },
  businessDetails: {
    businessName: "belgians waffle",
    primaryCategory: "Dessert Shop",
    phoneNumber: "+91 93339 11911",
    website: "https://example.com",
    address: "Boisar, Maharashtra",
    businessHours: "Mon-Sat, 10:00 AM - 8:00 PM",
    description: "Local business profile details will sync here after Google connection.",
  },
};

export const googleProfileNav = [
  { id: "overview", label: "Overview" },
  { id: "reviews", label: "Reviews" },
  { id: "photos", label: "Photos" },
  { id: "qr", label: "Review QR" },
  { id: "details", label: "Business Details" },
];

export const googleProfileDateRanges = ["Last 7 Days", "Last 30 Days", "Last 90 Days"];
