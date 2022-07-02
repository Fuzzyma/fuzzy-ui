export const getId = (prefix = 'id') => prefix + '-' + Math.random().toString(36).slice(-6)
