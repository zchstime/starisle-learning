export const slingLevels = [
 {title:'给小岛充满 8 格能量',target:8,ammo:[2,3,5],explain:'同一个数可以有不同的组合：3 + 5 = 8，2 + 3 + 3 也等于 8。'},
 {title:'唤醒 12 格能量灯塔',target:12,ammo:[3,4,6],explain:'6 + 6 = 12；3 + 3 + 3 + 3 = 12，重复相加也能写成乘法。'},
 {title:'向 20 格能量出发',target:20,ammo:[4,5,8],explain:'8 + 8 + 4 = 20；4 个 5 也是 20。你找到了哪一种组合？'}
];
export const balanceLevels = [
 {title:'让平衡桥停在水平线上',leftMass:2,leftArm:2,explain:'两边重量相同时，离支点的距离也相同，桥就能平衡。'},
 {title:'轻砝码也能托起重砝码',leftMass:4,leftArm:1,explain:'4 份重量 × 1 格距离 = 1 份重量 × 4 格距离。轻的一侧放远一些，也能平衡。'},
 {title:'找到新的平衡办法',leftMass:3,leftArm:2,explain:'3 × 2 = 2 × 3。重量和到支点的距离，一起决定杠杆向哪边转。'}
];
export function charge(total,value,target){const sum=total+value;return {total:sum>target?0:sum,over:sum>target,won:sum===target};}
export function torque(mass,arm){return mass*arm;}
export function isBalanced(lm,la,rm,ra){return torque(lm,la)===torque(rm,ra);}
