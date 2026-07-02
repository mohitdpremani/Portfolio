// Scroll-triggered reveal animations
;(function () {
  var reveals = document.querySelectorAll('.reveal')
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  )
  reveals.forEach(function (el) {
    observer.observe(el)
  })
})()

// Nav scroll-spy
;(function () {
  var links = document.querySelectorAll('.nav-link')
  var sections = Array.prototype.slice
    .call(links)
    .map(function (link) {
      return document.getElementById(link.dataset.section)
    })
    .filter(Boolean)

  if (!sections.length) return

  var observer = new IntersectionObserver(
    function (entries) {
      var visible = entries
        .filter(function (e) {
          return e.isIntersecting
        })
        .sort(function (a, b) {
          return b.intersectionRatio - a.intersectionRatio
        })

      if (visible.length > 0) {
        var activeId = visible[0].target.id
        links.forEach(function (link) {
          link.classList.toggle('active', link.dataset.section === activeId)
        })
      }
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  )

  sections.forEach(function (section) {
    observer.observe(section)
  })
})()

// Hero parallax on scroll
;(function () {
  var hero = document.getElementById('home')
  var video = document.querySelector('.hero-video')
  var content = document.querySelector('.hero-main')
  if (!hero || !video || !content) return

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function onScroll() {
    var heroHeight = hero.offsetHeight
    var progress = clamp(window.scrollY / heroHeight, 0, 1)

    var videoScale = 1 + progress * 0.15
    var videoOpacity = 1 - progress * 0.7
    var contentOpacity = 1 - clamp(window.scrollY / (heroHeight * 0.7), 0, 1)
    var contentY = progress * -80

    video.style.transform = 'scale(' + videoScale + ')'
    video.style.opacity = videoOpacity
    content.style.opacity = contentOpacity
    content.style.transform = 'translateY(' + contentY + 'px)'
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})()

// 3D Vision scene, initialized once the Three.js ES module has loaded (see index.html)
window.initVisionScene = function (THREE) {
  var canvas = document.getElementById('vision-canvas')
  var section = document.getElementById('vision')
  if (!canvas || !section) return

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 5)

  var scene = new THREE.Scene()

  var ambient = new THREE.AmbientLight(0xffffff, 0.6)
  var point = new THREE.PointLight(0xffffff, 30)
  point.position.set(4, 4, 4)
  scene.add(ambient, point)

  // Starfield
  var starCount = 1200
  var starPositions = new Float32Array(starCount * 3)
  for (var i = 0; i < starCount; i++) {
    var radius = 15 + Math.random() * 25
    var theta = Math.random() * Math.PI * 2
    var phi = Math.acos(2 * Math.random() - 1)
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    starPositions[i * 3 + 2] = radius * Math.cos(phi)
  }
  var starGeometry = new THREE.BufferGeometry()
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  var starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, sizeAttenuation: true })
  var stars = new THREE.Points(starGeometry, starMaterial)
  scene.add(stars)

  // Distorted wireframe icosahedron (simple sine-based vertex displacement, no external noise lib)
  var geometry = new THREE.IcosahedronGeometry(1.4, 4)
  var material = new THREE.ShaderMaterial({
    wireframe: true,
    transparent: true,
    uniforms: { uTime: { value: 0 } },
    vertexShader:
      'uniform float uTime;' +
      'void main() {' +
      '  vec3 p = position;' +
      '  float d = sin(p.x * 2.0 + uTime) * sin(p.y * 2.0 + uTime) * sin(p.z * 2.0 + uTime);' +
      '  p += normal * d * 0.18;' +
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);' +
      '}',
    fragmentShader:
      'void main() {' +
      '  gl_FragColor = vec4(1.0, 1.0, 1.0, 0.3);' +
      '}',
  })
  var core = new THREE.Mesh(geometry, material)
  scene.add(core)

  function resize() {
    var rect = section.getBoundingClientRect()
    var width = rect.width || window.innerWidth
    var height = rect.height || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  window.addEventListener('resize', resize)
  resize()

  var clock = new THREE.Clock()

  function animate() {
    requestAnimationFrame(animate)
    var elapsed = clock.getElapsedTime()
    var delta = clock.getDelta()

    core.rotation.x += delta * 0.08
    core.rotation.y += delta * 0.12
    material.uniforms.uTime.value = elapsed
    core.position.y = Math.sin(elapsed * 0.7) * 0.15

    stars.rotation.y += delta * 0.01

    renderer.render(scene, camera)
  }

  animate()
}
