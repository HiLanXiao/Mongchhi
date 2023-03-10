import { IApi } from '@mongchhi/types';
import { localUmiAppData, type IAppData } from '@mongchhi/utils';
import getUmiAppData from './getUmiAppData';

export default (api: IApi) => {
  api.onStart(() => {
    // @ts-ignore
    if (api.service.opts.frameworkName === 'mongchhi') {
      getUmiAppData();
    }
  });

  api.onDevCompileDone(() => {
    localUmiAppData.update((appData: IAppData) => ({
      ...appData,
      [api.appData.cwd]: api.appData,
    }));
  });
};
