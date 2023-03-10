import { localUmiAppData, type IAppData } from '@mongchhi/utils';
import { logger } from '@umijs/utils';
import findPortsInUse from './findPortsInUse';

const getAppDataUrl = (port: number | string) => {
  return `http://localhost:${port}/__umi/api/app-data`;
};

const getUmiAppByPort = async (port: number | string) => {
  // 控制器对象 用于终止fetch
  let controller = new AbortController();
  let signal = controller.signal;

  // 计时器
  let timeoutPromise = (timeout = 3000) => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject('time is up');
        controller.abort();
      }, timeout);
    });
  };
  let json: any = null;
  try {
    const { default: fetch } = await import('node-fetch');
    const url = getAppDataUrl(port);
    // 给fetch设置超时时间(请求56652端口会严重超时)
    json = await Promise.race([
      timeoutPromise(1000),
      fetch(url, { signal }).then((rest) => rest.json()),
    ]);
  } catch (e) {}
  return json;
};

const getUmiAppData = async () => {
  // 读取 appData 缓存
  // 从缓存页面中读取，或者从页面中打开磁盘目录
  // find live umi app
  const liveUmiApp = localUmiAppData.get();
  logger.profile('find', 'find live umi app...');
  // 寻找占用中的端口
  const portsInUse = findPortsInUse();
  const res = await Promise.all(
    portsInUse.map((port) => getUmiAppByPort(port)),
  );
  res.forEach((json: IAppData) => {
  if (json && json?.cwd) {
   liveUmiApp[json?.cwd] = json;
  }
});
  // 写入 appData 缓存
  localUmiAppData.set(liveUmiApp);
};

export default getUmiAppData;
