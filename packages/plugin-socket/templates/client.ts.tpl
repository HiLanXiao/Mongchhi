interface MongChhiScoket extends WebSocket {
  listen: (callback: Subscription<CallBackProps>) => Destructor;
}
let socket: MongChhiScoket;

type Subscription<T> = (val: T) => void;

class EventEmitter<T> {
  private subscriptions = new Set<Subscription<T>>();

  emit = (val: T) => {
    for (const subscription of this.subscriptions) {
      subscription(val);
    }
  };

  useSubscription = (callback: Subscription<T>) => {
    function subscription(val: T) {
      if (callback) {
        callback(val);
      }
    }
    this.subscriptions.add(subscription);
    return () => this.subscriptions.delete(subscription);
  };
}
interface CallBackProps {
  type: string;
  payload?: any;
  send?: any;
}

const socketEmitter = new EventEmitter<CallBackProps>();

function getSocketHost() {
  const url: any = location;
  const host = url.host;
  const isHttps = url.protocol === 'https:';
  const key = Math.random().toString(36).slice(5);
  return `${isHttps ? 'wss' : 'ws'}://${host}?who=MongChhi${key}`;
}

export function createSocket() {
  // 连接中，直接返回
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }
  socket = new WebSocket(getSocketHost(), 'webpack-hmr');
  let pingTimer: null = null;

  socket.listen = (callback: Subscription<CallBackProps>) => {
    return socketEmitter.useSubscription(callback);
  };

  socket.onmessage = async ({ data }) => {
    data = JSON.parse(data);
    switch (data.type) {
      case 'connected':
        console.log(`[MongChhi] connected.`);
        // 心跳包
        pingTimer = setInterval(() => socket.send('ping'), 30000);
        break;
      case 'reload':
        window.location.reload();
        break;
      case 'pong':
        console.log(`[MongChhi] I am live.`);
        break;
      default:
        socketEmitter.emit({
          send: socket.send,
          ...data,
        });
        break;
    }
  };
  socket.onclose = async () => {
    if (pingTimer) clearInterval(pingTimer);
    console.info('[MongChhi] Dev server disconnected. Polling for restart...');
    // webpack-hmr 会尝试重连，这里可以忽略
  };

  return socket;
}

export { socket };
