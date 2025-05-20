
/**
 * Chrome extension API type definitions
 */

declare namespace chrome {
  namespace runtime {
    function sendMessage(message: any): Promise<any>;
    const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
    };
    const lastError: {
      message: string;
    } | undefined;
  }
  
  namespace storage {
    interface StorageChange {
      oldValue?: any;
      newValue?: any;
    }
    
    const sync: {
      get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
    };
    
    const local: {
      get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
      set(items: { [key: string]: any }, callback?: () => void): void;
    };
    
    function onChanged(changes: { [key: string]: StorageChange }, areaName: string): void;
    const onChanged: {
      addListener(callback: (changes: { [key: string]: StorageChange }, areaName: string) => void): void;
      removeListener(callback: (changes: { [key: string]: StorageChange }, areaName: string) => void): void;
    };
  }
  
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
      windowId: number;
    }
    
    function query(queryInfo: { active?: boolean; currentWindow?: boolean; }, callback: (result: Tab[]) => void): void;
    function sendMessage(tabId: number, message: any): Promise<any>;
    function onUpdated(tabId: number, changeInfo: { status?: string; url?: string; }, tab: Tab): void;
    
    const onUpdated: {
      addListener(callback: (tabId: number, changeInfo: { status?: string; url?: string; }, tab: Tab) => void): void;
      removeListener(callback: (tabId: number, changeInfo: { status?: string; url?: string; }, tab: Tab) => void): void;
    };
    
    const onRemoved: {
      addListener(callback: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void): void;
      removeListener(callback: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void): void;
    };
  }
}
