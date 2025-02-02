import { Icons } from './icons';
import { Assets } from './assets';

type IconName = keyof typeof Icons;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Inject SVG assets
    const logoElement = document.getElementById('arregloLogo');
    const labelElement = document.getElementById('arregloLabel');
    
    if (logoElement) logoElement.innerHTML = Assets.arregloLogo;
    if (labelElement) labelElement.innerHTML = Assets.arregloLabel;

    document.querySelectorAll('[data-icon]').forEach(el => {
        const iconName = el.getAttribute('data-icon');
        if (iconName && isIconName(iconName)) {
            el.innerHTML = Icons[iconName];
        }
    });
});

// Type guard function to ensure we have a valid icon name
function isIconName(name: string): name is IconName {
    return name in Icons;
} 