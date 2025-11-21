// Calculate distance between two GPS coordinates using Haversine formula
// Returns distance in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

function isWithinRadius(userLat, userLon, targetLat, targetLon, radius = 10) {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radius;
}

module.exports = {
  calculateDistance,
  isWithinRadius
};

