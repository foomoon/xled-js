var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class FetchWrapper {
    constructor(baseURL = "", timeout = 5000) {
        this.defaults = {
            headers: {},
        };
        this.baseURL = baseURL;
        this.timeout = timeout;
    }
    addHeaders(newHeaders) {
        this.defaults.headers = Object.assign(Object.assign({}, this.defaults.headers), newHeaders);
    }
    request(endpoint, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.stringifyBodyIfJson(options);
            const url = `${this.baseURL}${endpoint}`;
            options.headers = Object.assign(Object.assign({}, this.defaults.headers), options.headers);
            try {
                const response = yield Promise.race([
                    fetch(url, options),
                    this.createTimeoutPromise(),
                ]);
                const data = yield response.json();
                this.handleResponseError(response, data);
                const combinedFetchResponse = Object.assign(Object.assign({}, response), { data });
                return combinedFetchResponse;
            }
            catch (error) {
                throw error;
            }
        });
    }
    get(endpoint, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(endpoint, Object.assign(Object.assign({}, options), { method: "GET" }));
        });
    }
    post(endpoint, body, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setHeaderIfJson(options);
            return this.request(endpoint, Object.assign(Object.assign({}, options), { method: "POST", body }));
        });
    }
    delete(endpoint, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(endpoint, {
                method: "DELETE",
                body: JSON.stringify(data),
            });
        });
    }
    put(endpoint, body, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setHeaderIfJson(options);
            return this.request(endpoint, Object.assign(Object.assign({}, options), { method: "PUT", body: JSON.stringify(body) }));
        });
    }
    stringifyBodyIfJson(options) {
        if (!options.headers) {
            return;
        }
        if (options.headers["Content-Type"] === "application/json") {
            options.body = JSON.stringify(options.body);
        }
    }
    createTimeoutPromise() {
        return new Promise((_, reject) => setTimeout(() => reject(new Error(`Request was aborted due to a timeout < ${this.timeout}ms.  Increase the timeout to avoid this error.`)), this.timeout));
    }
    setHeaderIfJson(options) {
        if (!options.headers) {
            options.headers = {};
        }
        if (!options.headers["Content-Type"]) {
            options.headers["Content-Type"] = "application/json";
        }
    }
    handleResponseError(response, data) {
        if (!response.ok) {
            throw new Error(data.message || "Error fetching data");
        }
    }
}
export default FetchWrapper;
