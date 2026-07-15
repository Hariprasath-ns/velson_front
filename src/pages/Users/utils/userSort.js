const compareStrings = (valA, valB, dir) => {
  const cleanA = String(valA || '').toLowerCase();
  const cleanB = String(valB || '').toLowerCase();
  if (cleanA < cleanB) return dir === 'asc' ? -1 : 1;
  if (cleanA > cleanB) return dir === 'asc' ? 1 : -1;
  return 0;
};

export const sortByName = (users, direction) => {
  return [...users].sort((a, b) => compareStrings(a.name, b.name, direction));
};

export const sortByEmail = (users, direction) => {
  return [...users].sort((a, b) => compareStrings(a.email, b.email, direction));
};

export const sortByRole = (users, direction) => {
  return [...users].sort((a, b) => compareStrings(a.role, b.role, direction));
};

export const sortByCreatedDate = (users, direction) => {
  return [...users].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return direction === 'asc' ? timeA - timeB : timeB - timeA;
  });
};

export const sortUsers = (users, field, direction) => {
  if (!field || !direction) return users;
  switch (field) {
    case 'name':
      return sortByName(users, direction);
    case 'email':
      return sortByEmail(users, direction);
    case 'role':
      return sortByRole(users, direction);
    case 'createdAt':
    case 'createdOn':
      return sortByCreatedDate(users, direction);
    default:
      return users;
  }
};
