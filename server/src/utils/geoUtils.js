/**
 * Calculate the great-circle distance between two points on the Earth
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
const calculateHaversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return null;
  }

  const R = 6371e3; // Earth radius in meters
  const toRad = (angle) => (angle * Math.PI) / 180;

  const φ1 = toRad(Number(lat1));
  const φ2 = toRad(Number(lat2));
  const Δφ = toRad(Number(lat2) - Number(lat1));
  const Δλ = toRad(Number(lon2) - Number(lon1));

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Check if the user is in verified proximity to the branch (threshold: 750 meters)
 * @param {Object} userCoords { latitude, longitude }
 * @param {Array} branchGeoJsonCoords [longitude, latitude]
 * @param {number} thresholdMeters
 */
const verifyGpsProximity = (userCoords, branchGeoJsonCoords, thresholdMeters = 750) => {
  if (!userCoords || !userCoords.latitude || !userCoords.longitude) {
    return { isVerified: false, distanceMeters: null, reason: 'User coordinates missing' };
  }

  if (!branchGeoJsonCoords || !Array.isArray(branchGeoJsonCoords) || branchGeoJsonCoords.length < 2) {
    return { isVerified: false, distanceMeters: null, reason: 'Branch coordinates missing' };
  }

  const [branchLon, branchLat] = branchGeoJsonCoords;
  const distanceMeters = calculateHaversineDistanceMeters(
    userCoords.latitude,
    userCoords.longitude,
    branchLat,
    branchLon
  );

  const isVerified = distanceMeters !== null && distanceMeters <= thresholdMeters;

  return {
    isVerified,
    distanceMeters,
    thresholdMeters,
    reason: isVerified 
      ? `Within ${distanceMeters}m of branch location (verified under ${thresholdMeters}m threshold)`
      : `User is ${distanceMeters}m away from branch (exceeds ${thresholdMeters}m verification threshold)`
  };
};

module.exports = {
  calculateHaversineDistanceMeters,
  verifyGpsProximity,
};
