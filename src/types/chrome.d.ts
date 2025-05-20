
// Type definitions for Chrome extension API
declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any): Promise<any>;
    const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
    };
  }
  
  namespace tabs {
    function query(queryInfo: { active: boolean; currentWindow: boolean }, callback: (tabs: any[]) => void): void;
    function sendMessage(tabId: number, message: any): Promise<any>;
  }
  
  namespace storage {
    const sync: {
      get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: object, callback?: () => void): void;
    };
    const local: {
      get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: object, callback?: () => void): void;
    };
  }
}
