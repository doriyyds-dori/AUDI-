import { MetricConfig } from './types';

export const PERFORMANCE_METRICS: Record<string, MetricConfig> = {
  dccFirst: { label: 'DCC首呼', target: 95, colIndex: 4, format: 'percent', unit: '%' },
  dccSecond: { label: 'DCC二呼', target: 90, colIndex: 7, format: 'percent', unit: '%' },
  inviteOpen: { label: '邀约开口率', target: 80, colIndex: 8, format: 'integer', unit: '%' },
  wechatOpen: { label: '加微开口率', target: 80, colIndex: 9, format: 'integer', unit: '%' },
  testDriveSat: { label: '试乘试驾满意度', target: 4.80, colIndex: 10, format: 'float', unit: '' },
  scheduleRate: { label: '试驾排程率', target: 90, colIndex: 13, format: 'percent', unit: '%' },
  returnVisit: { label: '次日回访率', target: 90, colIndex: 16, format: 'percent', unit: '%' },
  satSurvey: { label: '满意度4.5分占比', target: 90, colIndex: 19, format: 'percent', unit: '%' },
  transSat: { label: '交易协助满意度', target: 4.80, colIndex: 20, format: 'float', unit: '' },
  deliverySat: { label: '车辆交付满意度', target: 4.80, colIndex: 21, format: 'float', unit: '' },
};

export const OBSERVATION_METRICS: Record<string, MetricConfig> = {
  dccThird: { label: 'DCC三呼', target: 50, colIndex: 4, format: 'percent', unit: '%' },
  modelQA: { label: '车型信息质检', target: 85, colIndex: 5, format: 'integer', unit: '' },
  policyQA: { label: '政策相关质检', target: 85, colIndex: 6, format: 'integer', unit: '' },
  prospectWechat: { label: '潜客加微率', target: 20, colIndex: 9, format: 'percent', unit: '%' },
  badgeRate: { label: '工牌佩戴率', target: 90, colIndex: 12, format: 'percent', unit: '%' },
  privateLeadFollow: { label: '私域留资试驾及时跟进率', target: 95, colIndex: 15, format: 'percent', unit: '%' },
  testDriveRemind: { label: '试驾预约提醒率', target: 95, colIndex: 18, format: 'percent', unit: '%' },
  scheduleFulfill: { label: '排程履约率', target: 40, colIndex: 24, format: 'percent', unit: '%' },
  speechExec: { label: '试驾话术必说执行率（卖点）', target: 100, colIndex: 27, format: 'percent', unit: '%' },
  effectiveTestDrive: { label: '有效试驾率_试驾单维度', target: 95, colIndex: 30, format: 'percent', unit: '%' },
};

export const PERFORMANCE_CATEGORIES: Record<string, string[]> = {
  '线索邀约': ['DCC首呼', 'DCC二呼', '邀约开口率', '加微开口率'],
  '试乘试驾': ['试驾排程率', '次日回访率', '满意度4.5分占比'], 
  '客户满意度': ['交易协助满意度', '车辆交付满意度'],
};

export const OBSERVATION_CATEGORIES: Record<string, string[]> = {
  '邀约相关': ['DCC三呼', '车型信息质检', '政策相关质检', '潜客加微率', '私域留资试驾及时跟进率', '试驾预约提醒率'],
  '接待和跟进相关': ['工牌佩戴率', '排程履约率', '试驾话术必说执行率（卖点）', '有效试驾率_试驾单维度'],
};

export const DEFAULT_PERFORMANCE_CSV = `代理商,管家,分子,分母,指标,分子,分母,指标,指标,指标,指标,分子,分母,指标,分子,分母,指标,分子,分母,指标,指标,指标
示例代理商,小计,100,100,100%,80,80,100%,90,90,4.90,10,10,100%,10,10,100%,10,10,100%,5.00,5.00`;

export const DEFAULT_OBSERVATION_CSV = `代理商,管家,分子,分母,指标,指标,指标,分子,分母,指标,分子,分母,指标,分子,分母,指标,分子,分母,指标,分子,分母,指标,分子,分母,指标,分子,分母,指标,分子,分母,指标,指标
示例代理商,小计,50,50,100%,90,90,100,200,50%,10,10,100%,1,1,100%,4,4,100%,10,10,100%,10,10,100%,50,50,100%,10,10,100%,5.00`;