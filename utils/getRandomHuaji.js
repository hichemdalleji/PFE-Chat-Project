const huaji = {
    0: `${require('@/assets/images/huaji/0.jpg')}?width=250&height=250&huaji=true`,
    1: `${require('@/assets/images/huaji/1.gif')}?width=300&height=300&huaji=true`,
    2: `${require('@/assets/images/huaji/2.jpeg')}?width=224&height=225&huaji=true`,
    3: `${require('@/assets/images/huaji/3.jpg')}?width=400&height=400&huaji=true`,
    4: `${require('@/assets/images/huaji/4.jpeg')}?width=284&height=177&huaji=true`,
    5: `${require('@/assets/images/huaji/5.jpeg')}?width=223&height=226&huaji=true`,
    6: `${require('@/assets/images/huaji/5.jpeg')}?width=224&height=224&huaji=true`,
    7: `${require('@/assets/images/huaji/7.gif')}?width=100&height=110&huaji=true`,
    8: `${require('@/assets/images/huaji/8.jpeg')}?width=180&height=180&huaji=true`,
    9: `${require('@/assets/images/huaji/9.gif')}?width=164&height=192&huaji=true`,
    10: `${require('@/assets/images/huaji/10.gif')}?width=130&height=62&huaji=true`,
};
const HuajiaCount = Object.keys(huaji).length;

export default function getRandomHuaji() {
    const number = Math.floor(Math.random() * HuajiaCount);
    return huaji[number];
}
