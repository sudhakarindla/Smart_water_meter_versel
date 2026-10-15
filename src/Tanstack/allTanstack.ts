import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMeterApi,  addRefundApi, addVendorApi, changeMeterStatusApi, changeVendorMeterStatusApi, createSettlementApi, createVendorIssueApi, deleteCommissionConfigApi, deleteMeterApi, deleteVendorApi, deleteVendorIssueApi, downloadCommissionExcelApi, downloadCommissionPdfApi, downloadPaymentExcelApi, downloadPaymentPdfApi,getMeters, downloadSettlementExcelApi, downloadSettlementPdfApi, downloadVendorPdfApi, downloadVendorQrApi, generateMeterQrApi, getAdminProfileApi, getAdminSettlementsDashboard, getAllAdminIssuesApi, getAllTransactionsApi, getDashboardData, getFilteredTransactionsApi, getFilteredTrend, getMeterDetailsApi, getMetersDashboard, getMeterSettingsDetailsApi, getSettingsDashboard, getVendorDashboardData, getVendorFilteredTransactionsApi, getVendorFilteredTrend, getVendorIssuesApi, getVendorMetersDashboard, getVendorMetersListApi, getVendorMeterTransactions, getVendorProfileApi, getVendorsApi, getVendorSettlementsDashboard, getVendorTableDataApi, getVendorTransactionsApi, loginApi, processAdminSettlement, raiseVendorIssueApi, registerAdminApi, requestAdminOtpApi, requestPasswordResetApi, requestVendorSettlement, resolveAdminIssueApi, saveFullSetupApi, sendVendorEmailReportApi, setCommissionPercentages, updateCommissionConfigApi, updateMeterApi, updatePasswordWithOtpApi, updateVendorApi, updateVendorStatusApi, verifyAdminOtpApi, getSettlementHistory } from '../Api/allApi';
import { getAllIssuesApi, updateIssueApi, settle } from '../Api/allApi';
import { toast } from 'sonner';
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginApi,
  });
};

// Hook for main dashboard data
export const useDashboardData = (isAdmin : boolean) => {
  return useQuery({
    queryKey: ['dashboardData'], // Unique key for caching
    queryFn: getDashboardData,
    enabled: isAdmin,
  });
};

// Hook for filtered trend data
export const useFilteredTrend = (filterType: string, isAdmin : boolean) => {
  return useQuery({
    // Adding filterType to the array makes the query re-run automatically when the filter changes!
    queryKey: ['collectionTrend', filterType], 
    queryFn: () =>{  console.log("the filter is ", filterType);   return  getFilteredTrend(filterType)},
    // Optional: Keep previous data on screen while fetching the new filter
    placeholderData: (previousData) => previousData, 
    enabled: isAdmin,
  });
};

// Hook for meters data
export const useMetersData = (isAdmin : boolean) => {
  return useQuery({
    queryKey: ['metersDashboard'],
    queryFn: getMetersDashboard,
    enabled : isAdmin,
  });
};

export const useMeterDetails = (meterId: number | undefined) => {
  return useQuery({
    queryKey: ['meterDetails', meterId],
    queryFn: () => getMeterDetailsApi(meterId!),
    enabled: !!meterId, // Only fetch if a meter is actually selected
  });
};

// delete meters 

export const useMeterMutations = () => {
  const queryClient = useQueryClient();

  const addMeter = useMutation({
    mutationFn: addMeterApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metersDashboard'] }),
  });

  const updateMeter = useMutation({
    mutationFn: updateMeterApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metersDashboard'] }),
  });

  // --- OPTIMISTIC TOGGLE ---
  const toggleStatus = useMutation({
   mutationFn: changeMeterStatusApi,
  onMutate: async (variables) => {
    // 1. Cancel outgoing fetches
    await queryClient.cancelQueries({ queryKey: ['metersDashboard'] });
    
    // 2. Snapshot the current data
    const previousMeters = queryClient.getQueryData(['metersDashboard']);

    // 3. Update the cache OPTIMISTICALLY
    queryClient.setQueryData(['metersDashboard'], (old: any) => {
      if (!old) return [];
      return old.map((m: any) => 
        // CRITICAL: Match 'meter_id' (the raw backend key) with the incoming variable
        Number(m.meter_id) === Number(variables.meter_id) 
          ? { ...m, status: variables.status } 
          : m
      );
    });

    return { previousMeters };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['metersDashboard'], context?.previousMeters);
    toast.error("Failed to update status on server.");
  },
  onSettled: () => {
    // Refresh to ensure UI matches Database perfectly
    queryClient.invalidateQueries({ queryKey: ['metersDashboard'] });
  },
});

  // --- OPTIMISTIC DELETE ---
  const deleteMeter = useMutation({
    mutationFn: deleteMeterApi,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['metersDashboard'] });
      const previousMeters = queryClient.getQueryData(['metersDashboard']);

      // Optimistically remove the meter from the UI list instantly
      queryClient.setQueryData(['metersDashboard'], (old: any) => {
        return old ? old.filter((m: any) => m.meter_id !== deletedId) : [];
      });

      return { previousMeters };
    },
    onError: (err, deletedId, context) => {
      queryClient.setQueryData(['metersDashboard'], context?.previousMeters);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['metersDashboard'] });
    },
  });

  return { addMeter, updateMeter, toggleStatus, deleteMeter };
};
// vendor Dashboard

export const useVendorDashboardData = (role: string, vendorId: number | string) => {
  return useQuery({
    queryKey: ['dashboardData', role, vendorId], 
    queryFn: () => getVendorDashboardData(),
enabled: (role === "vendor" || role === "Vendor") && !!vendorId,
  });
};

export const useVendorFilteredTrend = (filterType: string, role: string, vendorId: number | string) => {
  return useQuery({
    queryKey: ['collectionTrend', filterType, role, vendorId], 
    queryFn: () => { 
      console.log("the filtertype is ",filterType)
      return getVendorFilteredTrend(filterType, vendorId)
    },
    placeholderData: (previousData) => previousData, 
   enabled: (role === "vendor" || role === "Vendor") && !!vendorId,
  });
};

// vendor login
export const useVendorLoginMutation = () => {
  return useMutation({
    mutationFn: loginApi,
  });
};


// settings 

export const useSettingsData = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['settingsDashboard'],
    queryFn: getSettingsDashboard,
    enabled: isAdmin, // Only fetch this data if the user is an admin
  });
};

// Mutation to update percentages
export const useUpdateCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setCommissionPercentages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settingsDashboard'] });
    },
  });
};

// ==========================================
// ADMIN SETTLEMENT HOOKS
// ==========================================

// Fetch Admin Dashboard Data
export const useAdminSettlementsData = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['adminSettlementsDashboard'],
    queryFn: getAdminSettlementsDashboard,
    enabled: isAdmin, // Only run if the user is an admin
  });
};

// Mutation to approve/process a settlement
export const useProcessSettlementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: processAdminSettlement,
    onSuccess: () => {
      // Instantly refresh the admin dashboard to remove the pending request
      queryClient.invalidateQueries({ queryKey: ['adminSettlementsDashboard'] });
    },
  });
};

// ==========================================
// VENDOR SETTLEMENT HOOKS
// ==========================================

// Fetch Vendor Dashboard Data
export const useVendorSettlementsData = (vendorId: number | string, isVendor: boolean) => {
  return useQuery({
    queryKey: ['vendorSettlementsDashboard', vendorId],
    queryFn: () => getVendorSettlementsDashboard(),
    enabled: isVendor && !!vendorId, // Only run if it's a vendor and we have an ID
  });
};

// Mutation to request a new settlement
export const useRequestSettlementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestVendorSettlement,
    onSuccess: () => {
      // Refresh the vendor's dashboard to show the new pending request
      queryClient.invalidateQueries({ queryKey: ['vendorSettlementsDashboard'] });
    },
  });
};

// ==========================================
// VENDOR METERS HOOKS
// ==========================================

export const useVendorMetersData = (vendorId: number | string, isVendor: boolean) => {
  return useQuery({
    queryKey: ['vendorMetersDashboard', vendorId],
    queryFn: () => getVendorMetersDashboard(),
    enabled: isVendor && !!vendorId,
  });
};

export const useVendorMeterTransactionsData = (vendorId: number | string, meterId: string | undefined) => {
  return useQuery({
    queryKey: ['vendorMeterTxns', vendorId, meterId],
    queryFn: () => getVendorMeterTransactions({ vendor_id: vendorId, meter_id: meterId! }),
    enabled: !!vendorId && !!meterId, // Only fetch when a specific meter is clicked
  });
};

export const useVendorMeterMutations = () => {
  const queryClient = useQueryClient();

  const toggleStatus = useMutation({
    mutationFn: changeVendorMeterStatusApi,
    onSuccess: (_, variables) => {
      // Refresh the meter list for this specific vendor
      queryClient.invalidateQueries({ queryKey: ['vendorMetersDashboard', variables.vendor_id] });
    },
  });

  return { toggleStatus };
};

// Hook to fetch Vendor Profile
export const useVendorProfileData = (vendorId: number | string, isVendor: boolean) => {
  return useQuery({
    queryKey: ['vendorProfile', vendorId],
    queryFn: () => getVendorProfileApi(vendorId),
    enabled: isVendor && !!vendorId, // Only runs if the user is a vendor
  });
};

// ==========================================
// TRANSACTIONS HOOKS
// ==========================================

// Admin transactions
export const useTransactionsData = (isAdmin: boolean, dateFilter: string) => {
  return useQuery({
    // Adding dateFilter to the queryKey means TanStack will automatically 
    // re-fetch the data from the backend whenever the dropdown changes!
    queryKey: ['transactions', dateFilter],
    queryFn: () => {
      // If "All Time" is selected, hit the GET route
      if (dateFilter === 'all') {
        return getAllTransactionsApi();
      }
      // Otherwise, hit the POST route with the specific filter string
      return getFilteredTransactionsApi(dateFilter);
    },
    // enabled: isAdmin,
    enabled: isAdmin && !!dateFilter && dateFilter !== "undefined",
    // This keeps the current table data visible while the new filtered data is loading
    placeholderData: (previousData) => previousData, 
  });
};

// Vendor transactions 

export const useVendorTransactionsData = (isVendor: boolean, dateFilter: string, vendorId?: number | string) => {
  return useQuery({
    // Use a unique query key for vendors
    queryKey: ['vendorTransactions', dateFilter, vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error("Vendor ID is required");
      
      // Hit the vendor routes
      if (dateFilter === 'all') {
        return await getVendorTransactionsApi(vendorId);
      }
      return await getVendorFilteredTransactionsApi(vendorId, dateFilter);
    },
    // ONLY run this if the user is explicitly a vendor and we have their ID
    enabled: isVendor && !!vendorId,
    placeholderData: (previousData) => previousData, 
  });
};


// ==========================================
// USER / VENDOR MANAGEMENT HOOKS
// ==========================================

export const useVendorsData = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['vendorsList'],
    queryFn: getVendorsApi,
    enabled: isAdmin, // Only Admins can see the user list
  });
};

export const useVendorMutations = () => {
  const queryClient = useQueryClient();

  const addVendor = useMutation({
    mutationFn: addVendorApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendorsList'] }),
  });

  const updateVendor = useMutation({
    mutationFn: updateVendorApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendorsList'] }),
  });

  const deleteVendor = useMutation({
    mutationFn: deleteVendorApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendorsList'] }),
  });

  const updateStatus = useMutation({
    mutationFn: updateVendorStatusApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendorsList'] }),
  });

  return { addVendor, updateVendor, deleteVendor, updateStatus };
};

// ==========================================
// AUTH HOOKS
// ==========================================

export const useRegisterAdmin = () => {
  return useMutation({
    mutationFn: registerAdminApi,
  });
};

// ==========================================
// REPORT HOOKS
// ==========================================

export const useDownloadPaymentExcel = () => {
  return useMutation({ mutationFn: downloadPaymentExcelApi });
};

export const useDownloadPaymentPdf = () => {
  return useMutation({ mutationFn: downloadPaymentPdfApi });
};

export const useSendVendorEmailReport = () => {
  return useMutation({ mutationFn: sendVendorEmailReportApi });
};


import { updateVendorProfileApi, updateVendorBankApi } from '../Api/allApi';

export const useVendorSettingsMutations = () => {
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: updateVendorProfileApi,
    onSuccess: (_, variables) => {
      // Refresh the profile data instantly
      queryClient.invalidateQueries({ queryKey: ['vendorProfile', variables.id] });
    },
  });

  const updateBank = useMutation({
    mutationFn: updateVendorBankApi,
    onSuccess: (_, variables) => {
      // Refresh the profile data instantly (since bank data comes from the same profile route)
      queryClient.invalidateQueries({ queryKey: ['vendorProfile', variables.data.vendor_id] });
    },
  });

  return { updateProfile, updateBank };
};

export const useAdminIssuesData = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['adminIssues'],
    queryFn: getAllAdminIssuesApi,
    enabled: isAdmin,
  });
};

export const useResolveIssueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveAdminIssueApi,
    onSuccess: () => {
      // Instantly refreshes the table to remove the ticket you just resolved
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
    }
  });
};

export const useUpdateIssueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIssueApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
    },
  });
};

export const useRaiseIssueMutation = () => {
  return useMutation({
    mutationFn: raiseVendorIssueApi,
  });
};



export const useSettelementHistoryData = (isAdmin : boolean) => {
  return useQuery({
    queryKey: ['settlementHistory'],
    queryFn: getSettlementHistory,
    enabled : isAdmin,
  });
};

export const useSettelMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settle ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlementHistory'] });
    },
  });
};





// export const useVendorNotifications = (vendorId: number, isVendor: boolean) => {
//   return useQuery({
//     queryKey: ['vendorNotifications', vendorId],
//     queryFn: () => getVendorIssuesApi(vendorId),
//     enabled: isVendor && !!vendorId,
//     refetchInterval: 60000, // Check for updates every minute
//   });
// };

// vendor issues

export const useDeleteIssueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVendorIssueApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
    },
  });
};

// commission configs 

export const useCommissionMutations = () => {
  const queryClient = useQueryClient();

  // Mutation for Deleting
  const deleteCommission = useMutation({
    mutationFn: deleteCommissionConfigApi,
    onSuccess: (res: any) => {
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Commission record deleted!");
        // This line re-fetches your settings data so the table updates instantly
        queryClient.invalidateQueries({ queryKey: ["settingsData"] });
      }
    },
    onError: () => toast.error("Failed to delete record"),
  });

  // Mutation for Updating (Activating/Deactivating)
  const toggleCommissionStatus = useMutation({
    mutationFn: updateCommissionConfigApi,
    onSuccess: (res: any) => {
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Commission status updated!");
        queryClient.invalidateQueries({ queryKey: ["settingsData"] });
      }
    },
    onError: () => toast.error("Failed to update status"),
  });

  return { deleteCommission, toggleCommissionStatus };
};


export const useCreateSettlementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSettlementApi,
    onSuccess: () => {
      // FIX: Match the actual keys used in your useAdminSettlementsData and useVendorSettlementsData hooks
      queryClient.invalidateQueries({ queryKey: ["adminSettlementsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["vendorSettlementsDashboard"] });
    },
  });
};

export const useRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addRefundApi,
    onSuccess: () => {
      // Refresh the transactions list so the status updates
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: requestPasswordResetApi,
  });
};


export const useUpdatePasswordMutation = () => {
  return useMutation({
    mutationFn: updatePasswordWithOtpApi,
  });
};

export const useDownloadVendorPdf = () => {
  return useMutation({ mutationFn: downloadVendorPdfApi });
};

export const useDownloadCommissionExcel = () => useMutation({ mutationFn: downloadCommissionExcelApi });
export const useDownloadCommissionPdf = () => useMutation({ mutationFn: downloadCommissionPdfApi });
export const useDownloadSettlementExcel = () => useMutation({ mutationFn: downloadSettlementExcelApi });
export const useDownloadSettlementPdf = () => useMutation({ mutationFn: downloadSettlementPdfApi });

export const useVendorTableData = (dates?: { start_date: string; end_date: string }) => {
  return useQuery({
    queryKey: ['vendorTableData', dates],
    queryFn: () => getVendorTableDataApi(dates),
    placeholderData: (prev) => prev, // Keeps old data on screen while fetching new dates
  });
};


export const useMeters = () => {
  return useQuery({
    queryKey: ['MetersGet', ],
    queryFn: () => getMeters(),
    placeholderData: (prev) => prev, // Keeps old data on screen while fetching new dates
  });
};






// ==========================================
// ADMIN PROFILE HOOK
// ==========================================
export const useAdminProfileData = (adminId: number | string, isAdmin: boolean) => {
  return useQuery({
    queryKey: ['adminProfile', adminId],
    queryFn: () => getAdminProfileApi(adminId),
    enabled: isAdmin && !!adminId, // Only fetch if they are an admin and we have an ID
  });
};

// ==========================================
// WATER SETTINGS HOOKS
// ==========================================
export const useVendorMetersList = () => {
  return useQuery({
    queryKey: ['vendorMetersList'],
    queryFn: getVendorMetersListApi,
  });
};

export const useMeterSettingsDetails = (meterId: string) => {
  return useQuery({
    queryKey: ['meterSettingsDetails', meterId],
    queryFn: () => getMeterSettingsDetailsApi(meterId),
    enabled: !!meterId, // Only fetch if a meter is actually selected
  });
};

export const useSaveFullSetupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveFullSetupApi,
    onSuccess: (_, variables) => {
      // Refresh the data for this specific meter to show it saved successfully
      queryClient.invalidateQueries({ queryKey: ['meterSettingsDetails', variables.meter_id] });
    },
  });
};

// QR  GENERATOR
export const useGenerateQrMutation = () => {
  return useMutation({
    mutationFn: generateMeterQrApi,
  });
};

// DOWNLOAD QR
export const useDownloadQrMutation = () => {
  return useMutation({
    mutationFn: downloadVendorQrApi,
  });
};

export const useRequestAdminOtp = () => {
  return useMutation({
    mutationFn: requestAdminOtpApi,
  });
};

export const useVerifyAdminOtp = () => {
  return useMutation({
    mutationFn: verifyAdminOtpApi,
  });
};

export const useVendorIssuesData = (isVendor: boolean) => {
  return useQuery({
    queryKey: ['vendorIssues'],
    queryFn: getVendorIssuesApi,
    enabled: isVendor, // Only run if they are a vendor
  });
};

export const useCreateVendorIssueMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createVendorIssueApi,
    onSuccess: () => {
      // Instantly refresh the list below the form when a new issue is submitted!
      queryClient.invalidateQueries({ queryKey: ['vendorIssues'] });
    }
  });
};
