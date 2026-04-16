import { onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Auto-scroll a container when dragging near its top/bottom edges.
 * Works with trackpads and mice alike.
 */
export function useAutoScroll(containerRef: Ref<HTMLElement | null>, edgeSize = 80, maxSpeed = 15) {
  let animationId: number | null = null
  let isDragging = false
  let mouseY = 0

  function onDragStart() {
    isDragging = true
    startScrollLoop()
  }

  function onDragEnd() {
    isDragging = false
    stopScrollLoop()
  }

  function onMouseMove(e: MouseEvent | TouchEvent) {
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY
    mouseY = clientY
  }

  function startScrollLoop() {
    function tick() {
      if (!isDragging || !containerRef.value) return

      const rect = containerRef.value.getBoundingClientRect()
      const relativeY = mouseY - rect.top
      const height = rect.height

      if (relativeY < edgeSize) {
        // Near top — scroll up
        const intensity = 1 - relativeY / edgeSize
        containerRef.value.scrollTop -= maxSpeed * intensity
      } else if (relativeY > height - edgeSize) {
        // Near bottom — scroll down
        const intensity = 1 - (height - relativeY) / edgeSize
        containerRef.value.scrollTop += maxSpeed * intensity
      }

      animationId = requestAnimationFrame(tick)
    }
    animationId = requestAnimationFrame(tick)
  }

  function stopScrollLoop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  onMounted(() => {
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('touchmove', onMouseMove, { passive: true })
    document.addEventListener('dragover', onMouseMove, { passive: true })

    // Detect drag via mouse/touch
    document.addEventListener('mousedown', onDragStart)
    document.addEventListener('mouseup', onDragEnd)
    document.addEventListener('touchstart', onDragStart, { passive: true })
    document.addEventListener('touchend', onDragEnd)

    // Detect HTML5 drag (vuedraggable uses sortablejs which uses this)
    document.addEventListener('dragstart', onDragStart)
    document.addEventListener('dragend', onDragEnd)
    document.addEventListener('drop', onDragEnd)
  })

  onUnmounted(() => {
    stopScrollLoop()
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('touchmove', onMouseMove)
    document.removeEventListener('dragover', onMouseMove)
    document.removeEventListener('mousedown', onDragStart)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('touchstart', onDragStart)
    document.removeEventListener('touchend', onDragEnd)
    document.removeEventListener('dragstart', onDragStart)
    document.removeEventListener('dragend', onDragEnd)
    document.removeEventListener('drop', onDragEnd)
  })
}
