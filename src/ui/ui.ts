import { Icons } from './icons';

type IconName = keyof typeof Icons;

document.querySelectorAll('[data-icon]').forEach(el => {
    const iconName = el.getAttribute('data-icon');
    if (iconName && isIconName(iconName)) {
        el.innerHTML = Icons[iconName];
    }
});

// Type guard function to ensure we have a valid icon name
function isIconName(name: string): name is IconName {
    return name in Icons;
} 