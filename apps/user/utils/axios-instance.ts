import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_BACK_END_URL 
    ? `${process.env.NEXT_PUBLIC_BACK_END_URL}/api/v1` 
    : "http://localhost:8080/api/v1";

const api = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'X-App-Id': 'toptopuser',
    }
})

interface FailedRequest {
    resolve: (token: string | null) => void;
    reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/auth/refresh") {
            
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then(() => {
                    return api(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await api.post("/auth/refresh");
                
                isRefreshing = false;
                processQueue(null);
                
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError as Error, null);
                
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("auth:expired"));
                }
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status === 401 && (originalRequest._retry || originalRequest.url === "/auth/refresh")) {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("auth:expired"));
            }
        }

        return Promise.reject(error);
    }
);

export default api;
