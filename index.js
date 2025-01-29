class DragAndDrop {

    constructor(
        draggableSelector = '#draggable', 
        gridSelector = '#drop-grid', 
        absoluteSelector = '#drop-absolute'
    ) {
        this.draggableElement = document.querySelector(draggableSelector);
        this.dropGridElement = document.querySelector(gridSelector);
        this.dropAbsoluteElement = document.querySelector(absoluteSelector);
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.clonedElement = null;
        this.hasTempElement = false;
        this.grid_temp_element = 'temp-grid-item';
        this.init();
    }

    init() {
        this.generateRandomColorElement(this.draggableElement);
        this.draggableElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
    }

    randomNumber(to, from) {
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }

    generateRandomColorElement(element) {
        const r = this.randomNumber(0, 255);
        const g = this.randomNumber(0, 255);
        const b = this.randomNumber(0, 255);
        element.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }

    createCloneDraggable(e) {
        this.clonedElement = this.draggableElement.cloneNode(true);
        this.clonedElement.classList.remove(...this.clonedElement.classList);
        const computedStyles = window.getComputedStyle(this.draggableElement);
        const maxZIndex = 2**31 - 1;
        Object.assign(this.clonedElement.style, {
            width: computedStyles.width,
            height: computedStyles.height,
            borderRadius: computedStyles.borderRadius,
            position: 'absolute',
            zIndex: maxZIndex
        });

        const rect = this.draggableElement.getBoundingClientRect();
        this.clonedElement.style.left = `${rect.left}px`;
        this.clonedElement.style.top = `${rect.top}px`;
        document.body.appendChild(this.clonedElement);
        this.draggableElement.style.visibility = 'hidden';
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;
        this.isDragging = true;
    }

    onMouseDown(e) {
        this.createCloneDraggable(e);
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('mouseup', (event) => this.onMouseUp(event));
    }

    calculateOverlapPercentage(cloneRect, targetRect) {
        if (!cloneRect || !targetRect || cloneRect.width === 0 || cloneRect.height === 0) {
            return 0;
        }
        const overlapX = Math.max(0, Math.min(cloneRect.right, targetRect.right) - Math.max(cloneRect.left, targetRect.left));
        const overlapY = Math.max(0, Math.min(cloneRect.bottom, targetRect.bottom) - Math.max(cloneRect.top, targetRect.top));
        const overlapArea = overlapX * overlapY;
        const cloneArea = cloneRect.width * cloneRect.height;
        return cloneArea > 0 ? overlapArea / cloneArea : 0;
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.clonedElement) return;
    
        const cloneRect = this.clonedElement.getBoundingClientRect();
        const gridRect = this.dropGridElement.getBoundingClientRect();
        this.clonedElement.style.left = `${e.clientX - this.offsetX}px`;
        this.clonedElement.style.top = `${e.clientY - this.offsetY}px`;
        const overlapPercentage = this.calculateOverlapPercentage(cloneRect, gridRect);
    
        if (overlapPercentage >= 0.5) {
            const gridItems = this.dropGridElement.children.length;
    
            if (gridItems < 9 && !this.hasTempElement) {
                const cloneColor = window.getComputedStyle(this.clonedElement).backgroundColor;
                this.tempGridItem = document.createElement('div');
                this.tempGridItem.classList.add(this.grid_temp_element);
                this.tempGridItem.style.backgroundColor = cloneColor;
                this.dropGridElement.appendChild(this.tempGridItem);
                this.hasTempElement = true;
            }
        } else if (overlapPercentage < 0.5 && this.hasTempElement) {
            this.removeTempGridItem();
            this.hasTempElement = false;
        }
    }

    removeTempGridItem() {
        if (this.tempGridItem) {
            this.tempGridItem.remove();
            this.tempGridItem = null;
        }
    }

    addElementToGridContainer(cloneColor) {
        const newGridItem = document.createElement('div');
        newGridItem.style.backgroundColor = cloneColor;
        this.dropGridElement.appendChild(newGridItem);
    }

    addElementToAbsoluteContainer(x, y, cloneColor) {
        const newAbsoluteItem = document.createElement('div');
        Object.assign(newAbsoluteItem.style, {
            backgroundColor: cloneColor,
            left: `${x}px`,
            top: `${y}px`,
        });
        this.dropAbsoluteElement.appendChild(newAbsoluteItem);
    }

    onMouseUp(event) {
        if (!this.clonedElement) return;
        
        const cloneRect = this.clonedElement.getBoundingClientRect();
        const gridRect = this.dropGridElement.getBoundingClientRect();
        const absoluteRect = this.dropAbsoluteElement.getBoundingClientRect();
        const overlapPercentage = this.calculateOverlapPercentage(cloneRect, gridRect);
        const gridItems = this.dropGridElement.children.length;
        const cloneColor = window.getComputedStyle(this.clonedElement).backgroundColor;
    
        if (overlapPercentage >= 0.5 && gridItems <= 9) {
            const lastItem = this.dropGridElement.lastElementChild;
            if (lastItem && lastItem.classList.contains(this.grid_temp_element)) {
                lastItem.remove();
                this.addElementToGridContainer(cloneColor);
    
                if (this.dropGridElement.children.length === 9) {
                    document.querySelector('.drag-and-drop__clue').style.display = 'block';
                }
            } 
            this.clonedElement.remove();
            this.generateRandomColorElement(this.draggableElement);
            this.draggableElement.style.visibility = 'visible';
            this.isDragging = false;
            document.removeEventListener('mousemove', this.onMouseMove);
            document.removeEventListener('mouseup', this.onMouseUp);
            return;
        }
    
        const isFullyInsideAbsolute =
            cloneRect.left >= absoluteRect.left && cloneRect.right <= absoluteRect.right &&
            cloneRect.top >= absoluteRect.top && cloneRect.bottom <= absoluteRect.bottom;
    
        if (isFullyInsideAbsolute) {
            const offsetX = cloneRect.left - absoluteRect.left;
            const offsetY = cloneRect.top - absoluteRect.top;
            this.addElementToAbsoluteContainer(offsetX, offsetY, cloneColor);
        }
    
        this.clonedElement.remove();
        this.generateRandomColorElement(this.draggableElement);
        this.draggableElement.style.visibility = 'visible';
        this.isDragging = false;
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }
}

const dragAndDrop = new DragAndDrop();
