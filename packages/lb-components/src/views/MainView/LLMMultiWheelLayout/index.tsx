import { AppProps } from '@/App';
import LLMMultiWheelView from '@/components/LLMMultiWheelView';
import { prefix } from '@/constant';
import { classnames } from '@/utils';
import { getClassName } from '@/utils/dom';
import { Layout } from 'antd/es';
import _ from 'lodash';
import { Resizable } from 're-resizable';
import React from 'react';
import Sidebar from '../sidebar';
import ToolFooter from '../toolFooter';

export const LLMMultiWheelViewCls = `${prefix}-LLMMultiWheelView`;

interface IProps {
  path: string;
  loading: boolean;
}

const { Sider, Content } = Layout;
const layoutCls = `${prefix}-layout`;

const LLMMultiWheelLayout: React.FC<AppProps & IProps> = (props) => {
  return (
    <Layout className={getClassName('layout', 'container')}>
      {props?.leftSider}
      <Content
        className={classnames({
          [`${layoutCls}__content`]: true,
          [`${prefix}-LLMLayout`]: true,
        })}
      >
        <LLMMultiWheelView
          showTips={props.showTips}
          tips={props.tips}
          drawLayerSlot={props.drawLayerSlot}
        />
        <ToolFooter style={props.style?.footer} mode={props.mode} footer={props?.footer} />
      </Content>
      <Resizable
        defaultSize={{
          width: 600,
        }}
        maxWidth='95%'
        enable={{ left: true }}
      >
        <Sider
          className={`${layoutCls}__side`}
          width='100%'
          style={{ position: 'relative', height: '100%' }}
        >
          <Sidebar sider={props?.sider} checkMode={props?.checkMode} />
          {props.drawLayerSlot?.({})}
        </Sider>
      </Resizable>
    </Layout>
  );
};

export default LLMMultiWheelLayout;
