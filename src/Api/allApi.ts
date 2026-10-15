// src/api/dashboardApi.ts
import { store } from '@/lib/store';
import { logout } from '@/lib/store/authSlice';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;
// ✅ FIXED: Now correctly looking for "smartjal_token"
const getAuth = () => {
  const token = localStorage.getItem("smartjal_token"); 
  return {
    headers: { Authorization: token ? `Bearer ${token}` : "" , "ngrok-skip-browser-warning":"true"}
  };
};

export const loginApi = async ({ email, password, role }: any) => {
  // Assuming you have separate endpoints for admin and vendor
  const endpoint = role === "admin" ? "/admin_login" : "/vendor_login";

  const response = await axios.post(`${BASE_URL}${endpoint}`, {
    user_name: email, // Your python backend looks for 'user_name'
    password: password,
  });
  console.log(response);

  // Return the token AND the role/email so we can save it to Redux
  return { 
    token: response.data.token, 
    email: response.data.email || email,
      name: response.data.name,
    role 
  };
};

// 1. Fetch the main dashboard data (GET request) for admin
export const getDashboardData = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/dashboard`,getAuth());
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
};

// 2. Fetch the filtered collection trend (POST request) for admin
export const getFilteredTrend = async (filterType: string) => {
    try {
        const response = await axios.post(`${BASE_URL}/filter_collection_trend`, {
            filter_type: filterType
        }, getAuth());
        return response.data;
    } catch (error) {
        console.error("Error fetching filtered trend:", error);
        throw error;
    }
};

// 3. fetches the meters data for admin .
// const getAuth = () => ({
//   // headers: { Authorization: `Bearer ${localStorage.getItem("smartjal_token")}` }
// });

export const getMetersDashboard = async () => {
  const response = await axios.get(`${BASE_URL}/meters_dashboard`, getAuth());
  return response.data.meters_details;
};

export const addMeterApi = async (formData: FormData) => {
  const response = await axios.post(`${BASE_URL}/add_meter`, formData, getAuth());
  return response.data;
};

export const updateMeterApi = async (formData: FormData) => {
  const response = await axios.put(`${BASE_URL}/update_meter`, formData, getAuth());
  return response.data;
};

export const changeMeterStatusApi = async ({ meter_id, status }: { meter_id: number, status: string }) => {
  const response = await axios.put(`${BASE_URL}/change_meter_status`, { meter_id, status }, getAuth());
  return response.data;
};

export const getMeterDetailsApi = async (meter_id: number) => {
  const response = await axios.post(`${BASE_URL}/meter_details`, { meter_id }, getAuth());
  return response.data.meter_details;
};

//vendor Dashboard

export const getVendorDashboardData = async () => {
  try {
    // Changed to axios.get, and removed the { vendor_id } payload
    const response = await axios.get(
      `${BASE_URL}/vendor_dashboard`, 
      getAuth()
    );
    
    return response.data;
  } catch (error) {
    console.error("Error in getVendorDashboardData:", error);
    throw error;
  }
};

export const getVendorFilteredTrend = async (filterType: string, vendorId: number | string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/vendor_filter_collection_trend`,
      { 
        filter_type: filterType, 
        vendor_id: vendorId 
      },
      getAuth()
    );

    return response.data;
  } catch (error) {
    console.error("Error in getVendorFilteredTrend:", error);
    // Throwing allows TanStack Query to trigger the 'onError' state
    throw error;
  }
};

// login for Vendors
export const vendorLoginApi = async ({ email, password, role }: { email: string, password: string, role: string }) => {
  // Dynamically choose the endpoint based on the selected role
  const endpoint = role === "admin" ? "/admin_login" : "/vendor_login";

  const response = await axios.post(`${BASE_URL}${endpoint}`, {
    user_name: email, // Python expects 'user_name'
    password: password,
  });

  // Return the token along with the email and role so the frontend can use it
  return { 
    token: response.data.token, 
    email, 
    role 
  };
};

// settings api call

export const getSettingsDashboard = async () => {
  const response = await axios.get(`${BASE_URL}/settings_dashboard`, getAuth());
  return response.data.percentages.map((row: any) => ({
    commission_type: row[0],
    percentage: Number(row[1])
  }));
};

export const setCommissionPercentages = async (payload: { daily: string, daily_percentage: number, immediate: string, immediate_percentage: number, updated_by: string }) => {
  const response = await axios.post(`${BASE_URL}/set_commission_percentages`, payload, getAuth());
  return response.data;
};


// ==========================================
// 6. ADMIN SETTLEMENTS
// ==========================================

export const getAdminSettlementsDashboard = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/settlement_dashboard`, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error fetching admin settlements:", error);
    throw error;
  }
};

export const processAdminSettlement = async (payload: { vendor_id: string | number, settle_id: string | number }) => {
  try {
    const response = await axios.post(`${BASE_URL}/settlement_now`, payload, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error processing settlement:", error);
    throw error;
  }
};

// ==========================================
// 7. VENDOR SETTLEMENTS
// ==========================================

export const getVendorSettlementsDashboard = async () => {
  try {
    // Changed to GET, removed the { vendor_id: vendorId } payload
    const response = await axios.get(
      `${BASE_URL}/vendor_settlement_dashboard`, 
      getAuth()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching vendor settlements:", error);
    throw error;
  }
};

export const requestVendorSettlement = async (payload: { amount: number, request_type: string }) => {
  try {
    // Map the frontend payload to the exact keys the backend expects
    const backendPayload = {
        net_amount: payload.amount,
        settlement_type: payload.request_type
    };

    const response = await axios.post(
      `${BASE_URL}/vendor_settlement_request`, 
      backendPayload, 
      getAuth()
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting vendor settlement:", error);
    throw error;
  }
};

// ==========================================
// 8. VENDOR METERS
// ==========================================

export const getVendorMetersDashboard = async () => {
  try {
    // Just the URL and the Auth headers. No data needed!
    const response = await axios.get(`${BASE_URL}/vendor_meters_dashboard`, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error fetching vendor meters:", error);
    throw error;
  }
};

export const changeVendorMeterStatusApi = async (payload: { vendor_id: number | string, meter_id: string, status: string }) => {
  try {
    const backendPayload = {
      vendor_id: payload.vendor_id,
      meter_unique_code: payload.meter_id, 
      status: payload.status
    };
    const response = await axios.put(`${BASE_URL}/vendor_change_meter_status`, payload, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error toggling vendor meter status:", error);
    throw error;
  }
};

export const getVendorMeterTransactions = async (payload: { vendor_id: number | string, meter_id: string }) => {
  try {
    const authConfig = getAuth(); // Get your auth headers
    
    // 👇 FIX: Changed from axios.post to axios.get
    const response = await axios.get(`${BASE_URL}/vendor_meter_details`, {
      ...authConfig,       // Spread the headers
      params: payload      // 👇 FIX: Send the payload as query params instead of a body!
    });
    
    return response.data.meter_details;
  } catch (error) {
    console.error("Error fetching vendor meter transactions:", error);
    throw error;
  }
};

// ==========================================
// 9. VENDOR PROFILE (SETTINGS)
// ==========================================

export const getVendorProfileApi = async (vendorId: number | string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/vendor_profile`, 
      { vendor_id: vendorId }, 
      getAuth()
    );
    return response.data.vendor;
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    throw error;
  }
};

// ==========================================
// 10. TRANSACTIONS 
// ==========================================

// Admin 
export const getAllTransactionsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/transaction_page`, getAuth());
    return response.data.collection_trend;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export const getFilteredTransactionsApi = async (filterType: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/transaction_filter`, 
      { filter_type: filterType }, 
      getAuth() // Headers
    );
    return response.data.collection_trend;
  } catch (error) {
    console.error("Error fetching filtered transactions:", error);
    throw error;
  }
};

// Vendor

// --- VENDOR TRANSACTIONS ---
export const getVendorTransactionsApi = async (vendorId: number | string) => {
  try {
    // Changed to GET, removed the data payload
    const response = await axios.get(
      `${BASE_URL}/vendor_transaction_page`, 
      getAuth()
    );
    return response.data.collection_trend;
  } catch (error) {
    console.error("Error fetching vendor transactions:", error);
    throw error;
  }
};

export const getVendorFilteredTransactionsApi = async (vendorId: number | string, filterType: string) => {
  try {
    // Changed to GET, moved filter_type into 'params'
    const response = await axios.get(`${BASE_URL}/vendor_transaction_filter`, {
      ...getAuth(),
      params: { 
        filter_type: filterType 
      }
    });
    return response.data.collection_trend;
  } catch (error) {
    console.error("Error fetching filtered vendor transactions:", error);
    throw error;
  }
};


// ==========================================
// 11. USER / VENDOR MANAGEMENT
// ==========================================

export const getVendorsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/get_vendors`, getAuth());
    return response.data.vendors;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw error;
  }
};


export const addVendorApi = async (formData: FormData) => {
  try {
    // ✅ Replaced the hardcoded headers with getAuth()
    const response = await axios.post(`${BASE_URL}/add_vendor`, formData, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error adding vendor:", error);
    throw error;
  }
};

export const updateVendorApi = async (formData: FormData) => {
  try {
    // ✅ Replaced the hardcoded headers with getAuth()
    const response = await axios.put(`${BASE_URL}/update_vendor`, formData, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error updating vendor:", error);
    throw error;
  }
};

export const deleteVendorApi = async (vendorId: number | string) => {
  try {
    // 1. Remove the /${vendorId} from the URL
    const response = await axios.delete(`${BASE_URL}/delete_vendor`, {
      ...getAuth(), // 2. Spread your authorization headers here
      data: {       // 3. Put the JSON payload inside the 'data' property
        vendor_id: vendorId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error deleting vendor:", error);
    throw error;
  }
};

export const updateVendorStatusApi = async (payload: { vendor_id: number | string, is_active: boolean }) => {
  try {
    const response = await axios.put(`${BASE_URL}/update_vendor_status`, payload, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error updating vendor status:", error);
    throw error;
  }
};

// ==========================================
// AUTHENTICATION & REGISTRATION
// ==========================================

export const registerAdminApi = async (payload: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/admin_register`, payload);
    return response.data;
  } catch (error) {
    console.error("Error registering admin:", error);
    throw error;
  }
};


// ==========================================
// REPORTS & EXPORTS
// ==========================================

// Helper function to handle downloading the Blob securely in the browser
const triggerDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadPaymentExcelApi = async (dates?: { start_date: string; end_date: string }) => {
  try {
    // We MUST set responseType to 'blob' for files!
    const config: any = { responseType: 'blob', ...getAuth() };
    let response;

    if (dates?.start_date && dates?.end_date) {
      response = await axios.post(`${BASE_URL}/payments_date_filter_excel`, dates, config);
    } else {
      response = await axios.get(`${BASE_URL}/payments_data_excel`, config);
    }
    triggerDownload(new Blob([response.data]), 'payment_report.xlsx');
    return true;
  } catch (error) {
    console.error("Error downloading Excel:", error);
    throw error;
  }
};

export const downloadPaymentPdfApi = async (dates?: { start_date: string; end_date: string }) => {
  try {
    const config: any = { responseType: 'blob', ...getAuth() };
    let response;

    if (dates?.start_date && dates?.end_date) {
      response = await axios.post(`${BASE_URL}/payments_date_filter_pdf`, dates, config);
    } else {
      response = await axios.get(`${BASE_URL}/payments_data_pdf`, config);
    }
    triggerDownload(new Blob([response.data]), 'payment_report.pdf');
    return true;
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
};

export const sendVendorEmailReportApi = async (dates?: { start_date: string; end_date: string }) => {
  try {
    const payload = dates?.start_date && dates?.end_date ? dates : {};
   const response = await axios.post(`${BASE_URL}/vendor_data_excel_main_send`, payload, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error sending vendor email:", error);
    throw error;
  }
};

// Add this to your allApi.ts file (near the other meter functions)
export const deleteMeterApi = async (meterId: number) => {
  try {
    // 1. Fixed the URL to match the Python route perfectly
    const response = await axios.delete(`${BASE_URL}/delete_meter`, {
      ...getAuth(), // 2. Spread your auth headers
      data: {       // 3. Send the ID inside the JSON body
        meter_id: meterId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error deleting meter:", error);
    throw error;
  }
};

// ==========================================
// VENDOR PROFILE & BANK UPDATES
// ==========================================

export const updateVendorProfileApi = async (payload: { id: number | string, data: any }) => {
  try {
    const response = await axios.put(`${BASE_URL}/update_vendor/${payload.id}`, payload.data, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    throw error;
  }
};

export const updateVendorBankApi = async (payload: { bank_id: number | string, data: any }) => {
  try {
    // Note: We are sending the bank_id in the URL, and the vendor_id in the data body
    const response = await axios.put(`${BASE_URL}/update-vendor-bank-ac/${payload.bank_id}`, payload.data, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error updating vendor bank:", error);
    throw error;
  }
};


// ==========================================
// SUPPORT TICKETS (ADMIN)
// ==========================================
export const getAllIssuesApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/get_all_issues`, getAuth());
    return response.data.issues;
  } catch (error) {
    console.error("Error fetching issues:", error);
    throw error;
  }
};

export const updateIssueApi = async (payload: { id: number | string, data: any }) => {
  try {
    const response = await axios.put(`${BASE_URL}/update_vendor_issue/${payload.id}`, payload.data, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error updating issue:", error);
    throw error;
  }
};


export const raiseVendorIssueApi = async (payload: { vendor_id: number | string, subject: string, message: string }) => {
  try {
    const response = await axios.post(`${BASE_URL}/raise_vendor_issue`, payload, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error raising ticket:", error);
    throw error;
  }
};

// export const getVendorIssuesApi = async (vendorId: number | string) => {
//   try {
//     const response = await axios.get(`${BASE_URL}/get_vendor_issues`, getAuth());
//     return response.data.issues; // This returns all tickets for this vendor
//   } catch (error) {
//     console.error("Error fetching vendor notifications:", error);
//     throw error;
//   }
// };

// this will delete the vendor issues.
export const deleteVendorIssueApi = async (id: number) => {
  try {
    const response = await axios.delete(`${BASE_URL}/delete-vendor-issue/${id}`, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error deleting issue:", error);
    throw error;
  }
};

// DELETE a specific commission record by its ID
export const deleteCommissionConfigApi = async (id: number) => {
  try {
    const response = await axios.delete(`${BASE_URL}/delete-commission-config/${id}`, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error deleting commission config:", error);
    throw error;
  }
};

// UPDATE an existing commission record (e.g., to set is_active to true)
export const updateCommissionConfigApi = async (payload: { id: number; data: any }) => {
  try {
    const response = await axios.put(`${BASE_URL}/update-commission-config/${payload.id}`, payload.data, getAuth());
    return response.data;
  } catch (error) {
    console.error("Error updating commission config:", error);
    throw error;
  }
};

export const createSettlementApi = async (payload: any) => {
  const response = await axios.post(`${BASE_URL}/add_settlement`, payload, getAuth());
  return response.data;
};

export const addRefundApi = async (payload: any) => {
  const response = await axios.post(`${BASE_URL}/add-refunds`, payload, getAuth());
  return response.data;
};

export const requestPasswordResetApi = async (payload: { email: string; role: string }) => {
  // We send the email and role to the backend
  const response = await axios.post(`${BASE_URL}/request_password_reset`, payload);
  return response.data;
};

export const updatePasswordWithOtpApi = async (payload: { email: string; role: string; otp_code: string; new_password: string }) => {
  const response = await axios.post(`${BASE_URL}/verify_and_update_password`, payload);
  return response.data;
};


// 4. Vendor-wise Report - PDF
export const downloadVendorPdfApi = async (dates?: { start_date: string; end_date: string }) => {
  try {
    const config: any = { responseType: 'blob', ...getAuth() };
    let response;

    if (dates?.start_date && dates?.end_date) {
      // Calls the POST route when dates are provided
      response = await axios.post(`${BASE_URL}/vendors_date_filter_pdf`, dates, config);
    } else {
      // Calls the GET route when downloading "All Time"
      response = await axios.get(`${BASE_URL}/vendors_data_pdf`, config);
    }
    
    // Note: { type: 'application/pdf' } helps the browser know it's a real PDF
    triggerDownload(new Blob([response.data], { type: 'application/pdf' }), `vendor_report_${Date.now()}.pdf`);
    return true;
  } catch (error) {
    console.error("Error downloading Vendor PDF:", error);
    throw error;
  }
};





// ==========================================
// NEW: COMMISSION REPORTS
// ==========================================

export const downloadCommissionExcelApi = async (dates?: { start_date: string; end_date: string }) => {
  const config: any = { responseType: 'blob', ...getAuth() };
  const response = dates?.start_date && dates?.end_date
    ? await axios.post(`${BASE_URL}/commission_date_filter_excel`, dates, config)
    : await axios.get(`${BASE_URL}/commission_data_excel`, config);
    
  triggerDownload(new Blob([response.data]), `Commission_Report_${Date.now()}.xlsx`);
  return true;
};

export const downloadCommissionPdfApi = async (dates?: { start_date: string; end_date: string }) => {
  const config: any = { responseType: 'blob', ...getAuth() };
  const response = dates?.start_date && dates?.end_date
    ? await axios.post(`${BASE_URL}/commission_date_filter_pdf`, dates, config)
    : await axios.get(`${BASE_URL}/commission_data_pdf`, config);
    
  triggerDownload(new Blob([response.data], { type: 'application/pdf' }), `Commission_Report_${Date.now()}.pdf`);
  return true;
};

// ==========================================
// NEW: SETTLEMENT REPORTS
// ==========================================

export const downloadSettlementExcelApi = async (dates?: { start_date: string; end_date: string }) => {
  const config: any = { responseType: 'blob', ...getAuth() };
  const response = dates?.start_date && dates?.end_date
    ? await axios.post(`${BASE_URL}/settlement_date_filter_excel`, dates, config)
    : await axios.get(`${BASE_URL}/settlement_data_excel`, config);
    
  triggerDownload(new Blob([response.data]), `Settlement_Report_${Date.now()}.xlsx`);
  return true;
};

export const downloadSettlementPdfApi = async (dates?: { start_date: string; end_date: string }) => {
  const config: any = { responseType: 'blob', ...getAuth() };
  const response = dates?.start_date && dates?.end_date
    ? await axios.post(`${BASE_URL}/settlement_date_filter_pdf`, dates, config)
    : await axios.get(`${BASE_URL}/settlement_data_pdf`, config);
    
  triggerDownload(new Blob([response.data], { type: 'application/pdf' }), `Settlement_Report_${Date.now()}.pdf`);
  return true;
};


export const getVendorTableDataApi = async (dates?: { start_date: string; end_date: string }) => {
  const payload = dates?.start_date && dates?.end_date ? dates : {};
  const response = await axios.post(`${BASE_URL}/vendors_report_data_json`, payload, getAuth());
  return response.data.data;
};


axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const msg = error.response.data.error || error.response.data.message;

      if (msg === "Token expired" || msg === "Token missing") {
        // ✅ 1. Use the Redux Helper 
        // This clears the state AND the localStorage in one go!
        store.dispatch(logout()); 

        // ✅ 2. Redirect
        // Using window.location.href is a "hard" redirect which is 
        // safest when handling session expiration to clear any stuck memory.
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);


// ==========================================
// ADMIN PROFILE
// ==========================================
export const getAdminProfileApi = async (adminId: number | string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/get_admin`, 
      { id: adminId }, 
      getAuth()
    );
    return response.data.data; // 👈 Extracts the 'data' dictionary from your Python response
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    throw error;
  }
};

// ==========================================
// WATER SETTINGS APIS
// ==========================================
export const getVendorMetersListApi = async () => {
  const response = await axios.get(`${BASE_URL}/get_meters`, getAuth());
  return response.data.meters;
};

export const getMeterSettingsDetailsApi = async (meterId: string) => {
  const response = await axios.get(`${BASE_URL}/meter_settings_details`, {
    // You MUST put your data inside a 'params' object for GET requests
    params: {
      meter_id: meterId
    },
    // Spread the auth headers into this configuration object
    ...getAuth() 
  });
  
  return response.data.data;
};

export const saveFullSetupApi = async (payload: any) => {
  const response = await axios.post(`${BASE_URL}/full_setup`, payload, getAuth());
  return response.data;
};

// QR GENERATOR

export const generateMeterQrApi = async (payload: { meterCode: string, vendorId: string | number, location: string }) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/generate_qr_code`,
      { 
        meter_unique_code: payload.meterCode,
        vendor_id: payload.vendorId,
        location: payload.location
      },
      getAuth()
    );

    // 👇 ADD THIS: If the backend sends the duplicate message, force an error!
    if (response.data.message === "meter_unique_code is already assigned for other meter. Try with another one.") {
      throw new Error("This Meter ID already exists. Try a different one.");
    }

    return response.data;
  } catch (error: any) {
    console.error("Error generating QR:", error);
    // 👇 Extract our custom error message so the toast can display it
    throw error.response?.data?.message || error.message || "Failed to generate QR";
  }
};

// DOWNLOAD QR 

export const downloadVendorQrApi = async (meterId: string) => {
  try {
    const authConfig = getAuth(); // Assume this returns { headers: { Authorization: "Bearer ..." } }
    
    const response = await axios.post(
      `${BASE_URL}/download_qr`,
      { meter_id: meterId },
      {
        headers: authConfig.headers,
        responseType: 'blob', // 👈 Crucial for downloading files!
      }
    );
    return response.data; 
  } catch (error) {
    console.error("Error downloading QR:", error);
    throw error;
  }
};


// Step 1: Request OTP
export const requestAdminOtpApi = async (payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
}) => {
  const response = await axios.post(`${BASE_URL}/admin_register`, payload);
  return response.data;
};

// Step 2: Verify OTP
export const verifyAdminOtpApi = async (payload: { email: string; OTP: string }) => {
  const response = await axios.post(`${BASE_URL}/verify_OTP`, payload);
  return response.data;
};

// --- ADMIN SIDE SUPPORT TICKETS ---

export const getVendorIssuesApi = async () => {
  const response = await axios.get(`${BASE_URL}/vendor_support`, getAuth());
  return response.data.Issues_Data;
};

export const createVendorIssueApi = async (payload: { subject: string, message: string }) => {
  const response = await axios.post(`${BASE_URL}/insert_vendor_issue`, payload, getAuth());
  return response.data;
};

// Fetch all unresolved issues for the Admin
export const getAllAdminIssuesApi = async () => {
  const response = await axios.get(`${BASE_URL}/get_all_issues`, getAuth());
  return response.data.issues; 
};

export  const getMeters =async () => {
  const response = await axios.get(`${BASE_URL}/vendor_reports_page`, getAuth());
  return response.data?.["Id's"]
; 
}  

export  const getSettlementHistory =async () => {
  const response = await axios.get(`${BASE_URL}/settlement_history`, getAuth());
  return response.data?.data
; 
} 

export  const settle =async (data) => {
  const response = await axios.post(`${BASE_URL}/complete_settlement`, data, getAuth());
  return response?.data;
} 



// Send the admin's reply back to the server
export const resolveAdminIssueApi = async (payload: { id: number, response: string }) => {
  // Backend expects 'id' and 'response' inside the JSON body
  const response = await axios.post(`${BASE_URL}/insert_admin_response`, payload, getAuth());
  return response.data;
};