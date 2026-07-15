import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

// Cache Durations
const CACHE_30_MIN = 30 * 60 * 1000
const CACHE_10_MIN = 10 * 60 * 1000
const CACHE_5_MIN = 5 * 60 * 1000
const CACHE_INFINITY = Infinity

// 1. Reference Master Hook (30 mins cache)
export function useReferenceMaster(type) {
  return useQuery({
    queryKey: ['reference-master', type],
    queryFn: async () => {
      if (!type) return []
      const res = await api.get(`/api/reference-master/${encodeURIComponent(type)}`, { skipGlobalLoader: true })
      return res.data?.data || []
    },
    enabled: !!type,
    staleTime: CACHE_30_MIN,
  })
}

// 2. Customer Master Hook (10 mins cache)
export function useCustomers() {
  return useQuery({
    queryKey: ['customer-master'],
    queryFn: async () => {
      const res = await api.get('/api/customer-master')
      return res.data?.data || []
    },
    staleTime: CACHE_INFINITY,
  })
}

// 3. Vehicle Master Hook (10 mins cache)
export function useVehicles() {
  return useQuery({
    queryKey: ['vehicle-master'],
    queryFn: async () => {
      const res = await api.get('/api/vehicle-master')
      return res.data?.data || []
    },
    staleTime: CACHE_INFINITY,
  })
}

// 4. Tax Master Hook (10 mins cache)
export function useTaxes() {
  return useQuery({
    queryKey: ['tax-master'],
    queryFn: async () => {
      const res = await api.get('/api/tax-master')
      return res.data?.data || []
    },
    staleTime: CACHE_INFINITY,
  })
}

// 5. Item Group Master Hook (10 mins cache)
export function useItemGroups() {
  return useQuery({
    queryKey: ['item-group-master'],
    queryFn: async () => {
      const res = await api.get('/api/item-group-master')
      return res.data?.data || []
    },
    staleTime: CACHE_INFINITY,
  })
}

// 6. Employee Master Hook (10 mins cache)
export function useEmployees() {
  return useQuery({
    queryKey: ['employee-master'],
    queryFn: async () => {
      const res = await api.get('/api/employee-master')
      return res.data?.data || []
    },
    staleTime: CACHE_INFINITY,
  })
}

// 7. Service Spare Hook (5 mins cache)
export function useServiceSpares() {
  return useQuery({
    queryKey: ['service-spare'],
    queryFn: async () => {
      const res = await api.get('/api/service-spare')
      return res.data?.data || []
    },
    staleTime: CACHE_5_MIN,
  })
}

// 8. Service Booking Hook (5 mins cache)
export function useServiceBookings() {
  return useQuery({
    queryKey: ['service-booking'],
    queryFn: async () => {
      const res = await api.get('/api/service-booking')
      return res.data?.data || []
    },
    staleTime: CACHE_5_MIN,
  })
}

// 9. Material Issue Hook (5 mins cache)
export function useMaterialIssues() {
  return useQuery({
    queryKey: ['material-issue'],
    queryFn: async () => {
      const res = await api.get('/api/material-issue')
      return res.data?.data || []
    },
    staleTime: CACHE_5_MIN,
  })
}

// 10. BOM Creation Hook (5 mins cache)
export function useBoms() {
  return useQuery({
    queryKey: ['bom-creation'],
    queryFn: async () => {
      const res = await api.get('/api/bom-creation')
      return res.data?.data || []
    },
    staleTime: CACHE_5_MIN,
  })
}


// ADD to src/hooks/useMasterData.js

export function useSuppliers() {
  return useQuery({
    queryKey: ['supplier-master'],
    queryFn: async () => {
      const res = await api.get('/api/supplier-master')
      return res.data?.data || []
    },
    staleTime: Infinity,  // master data — never changes mid-session
  })
}

export function usePurchaseRequests() {
  return useQuery({
    queryKey: ['purchase-request'],
    queryFn: async () => {
      const res = await api.get('/api/purchase-request')
      return res.data?.data || []
    },
    staleTime: CACHE_5_MIN,
  })
}