export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (err) {
    return '-';
  }
};

export const getRoleLabel = (role) => {
  if (!role) return 'User';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const getStatusLabel = (isActive) => {
  return isActive ? 'Active' : 'Inactive';
};
