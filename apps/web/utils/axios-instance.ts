import axios from "axios";

const REQUESTS_DISABLED_ON_PAGE = "REQUESTS_DISABLED_ON_PAGE";

export const getBackendBaseUrl = () => {
    if (typeof window === "undefined") {
        return process.env.NEXT_PUBLIC_BACK_END_URL || "http://localhost:8080";
    }


    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return (
            process.env.NEXT_PUBLIC_BACK_END_URL ||
            "http://localhost:8080"
        );
    }

    const ipBackendUrl = process.env.NEXT_PUBLIC_IP_BACK_END_URL;
    const configuredBackendUrl = process.env.NEXT_PUBLIC_BACK_END_URL;

    if (ipBackendUrl) {
        return ipBackendUrl;
    }

    if (
        configuredBackendUrl &&
        !configuredBackendUrl.includes("localhost") &&
        !configuredBackendUrl.includes("127.0.0.1")
    ) {
        return configuredBackendUrl;
    }

    return `http://${hostname}:8080`;
};

const baseUrl = `${getBackendBaseUrl()}/api/v1`;

const api = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'X-App-Id': 'toptopuser',
    }
})

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const isMaintenance = !!document.querySelector(".is-maintenance-page");
        const isNotFound = !!document.querySelector(".is-not-found-page");

        if (path.includes("/maintenance") || isMaintenance || isNotFound) {
            return Promise.reject(new Error(REQUESTS_DISABLED_ON_PAGE));
        }
    }
    return config;
});

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

const isAccountStatusError = (message?: string) => {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return (
        normalized.includes("account is not active") ||
        normalized.includes("account has been banned") ||
        normalized.includes("account has been suspended") ||
        normalized.includes("account is locked") ||
        normalized.includes("tài khoản")
    );
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error instanceof Error && error.message === REQUESTS_DISABLED_ON_PAGE) {
            return Promise.reject(error);
        }

        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || "";
        const isAuthRequest = requestUrl.startsWith("/auth/");
        const shouldRefreshToken =
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            requestUrl !== "/auth/refresh" &&
            !isAuthRequest;

        if (shouldRefreshToken) {
            
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

        if (error.response?.status === 401 && (originalRequest?._retry || requestUrl === "/auth/refresh")) {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("auth:expired"));
            }
        }

        if (
            error.response?.status === 403 &&
            !isAuthRequest &&
            isAccountStatusError(error.response?.data?.message)
        ) {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("auth:expired"));
            }
        }

        if (!error.response || error.response.status === 503) {
            if (typeof window !== "undefined" && !window.location.pathname.includes("/maintenance")) {
                window.location.href = "/maintenance";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
