function init() 
{
	//	Need Camera, Lights, Objects, and Renderer. The Scene is the container for Lights and Objects...
	
	var animationAction;
	var worldRadius = 4000;
	var soaringTimeSeconds = Math.floor(Math.random() * 10) + 1;
	var birdMaxHeight = 0;
	var birdMinHeight = 1;
	var birdIncrement = 0.015;
	var darkening = true;
	var lightening = !darkening;
	var daySeconds = 30;
	var dayInterval = 0;
	var lightingMinimum = 0.2;
	var intensityIncrement = 0.0001;

	//	First, create a Stats display for upper left hand screen realtime info. 
	//	Init to 'frames per second'...
	
	var stats = setupStats();
		
	//	Construct the Renderer...

	var renderer = setupRenderer();
	
	window.addEventListener('resize', onWindowResize, false);

  	//	Create a scene...
	
  	var scene = new THREE.Scene();
	scene.background = new THREE.Color(0xf0f0f0);
	
	//	Warning: Object3D's position, rotation, quaternion and scale properties are immutable.
	//	This requires some finagling when altering positions...
		
	var target = new THREE.Object3D();
	var position = new THREE.Vector3(0, 10, 2);
	target.position.copy(position);

	//	Directional light...
	
	var directionalLight = setupDirectionalLight(target);
	var directionalLightControls = setupDirectionalLightControls(directionalLight);
    scene.add(directionalLight);
	    	
	// 	Ambient illumination. Ambient light does not cast a shadow...

	var ambientLight = setupAmbientLight();	
    scene.add(ambientLight);
	
	//	Fog to obscure the horizon...
	
	scene.fog = new THREE.Fog(0xf0f0f0, 1, 390);
      
	//	Build the landscape...
		
	sphere = setupWorld(worldRadius);
	scene.add(sphere);
		
	//	Create and orient a Camera, adding the Camera to the Scene and position it...
	
	var camera = setupCamera(target);
	scene.add(camera);

	var trackballControls = setupTrackball(camera, renderer);
	var orbitControls = setupOrbitControls(camera, renderer);
	
	var clock = new THREE.Clock();

	var mixer = setupMixer();
		
	var mixerControls = setupMixerControls(mixer);

	var viewingControls = setupViewingControls();
	
	//	We're done with setup. Load the bird image glb file...
	
	gltfload();
	
	//	We've loaded the glb file. Now render it...
	
	render();
		
	//	The functions...
	
	function setupStats() 
	{
		var stats = new Stats();
		stats.showPanel(0); 		// 0: fps, 1: ms, 2: MB, 3+: custom
		document.body.appendChild(stats.dom);
		
		return stats;
	}
	
	function setupRenderer()
	{
		var renderer = new THREE.WebGLRenderer();
		renderer.setClearColor(new THREE.Color(0x000000));
		renderer.setSize(window.innerWidth, window.innerHeight);
		
		// 	PCFSoftShadowMap filters shadow maps using the Percentage-Closer Filtering (PCF)
		//	algorithm with better soft shadows especially when using low-resolution shadow maps...
		
		renderer.shadowMap.enabled = true;		//	use shadow maps in the scene...
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		
		//	Attach the output of the renderer to the document...
		
		document.getElementById("webgl-output").appendChild(renderer.domElement);
		return renderer;
	}
	
	function setupDirectionalLight(target)
	{
		//	A directional light is added for shadowing. The bird's shadow should blur a bit as it gets higher, 
		//	sharpen as it descends (the penumbra)...

		var directionalLight = new THREE.DirectionalLight(0xffffff);
		directionalLight.position.set(0, 50, 24);
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.fov = 12;
		directionalLight.castShadow = true;
		
		directionalLight.target = target;
		directionalLight.name = "directionalLight";
		
		return directionalLight;
	}
		
	function setupDirectionalLightControls(directionalLight)
	{
		var directionalLightControls = 
		{
			x: directionalLight.position.x,
			y: directionalLight.position.y,
			z: directionalLight.position.z,
			fov: directionalLight.shadow.camera.fov,
			target_x: directionalLight.target.position.x,
			target_y: directionalLight.target.position.y,
			target_z: directionalLight.target.position.z
		}
		
		return directionalLightControls;
	}
	
	function setupAmbientLight()
	{
		var ambientLight = new THREE.AmbientLight(0xFFFFFF);
		ambientLight.name = "ambientLight";
		
		return ambientLight;
	}
	
	function setupCamera(target)
	{
		var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
		
		//	Three.js camera position is (x, y, z) axes. Three.js has its own style axes definition:
		// 	+x points to the right of the screen...
		// 	-x points to the left of the screen...
		// 	+y points to the top of the screen...
		// 	-y points to the bottom of the screen...
		// 	+z points out of the screen (towards the observer)...
		// 	-z points into the screen (away from the observer)...
		
		camera.position.x = -40;
		camera.position.y = 20;
		camera.position.z = 40;
		camera.lookAt(target.position);
		
		return camera;
	}
	
	function setupOrbitControls(camera, renderer)
	{
		var orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
		orbitControls.autoRotate = true;
		
		return orbitControls;
	}
	
	function setupMixer()
	{
		return new THREE.AnimationMixer();
	}
	
	function setupMixerControls(mixer)
	{
		var mixerControls = {
			time: 0,
			timeScale: 1,
			stopAllAction: () =>
			{
				//	Force stop...
				
				mixer.stopAllAction()
			}
		}
		return mixerControls;
	}
	
	function setupViewingControls()
	{
		var viewingControls = {
			intensityIncr: intensityIncrement,
			autoRotateSpeed: 1.0
		}
		
		return viewingControls;
	}

	function enableControls() 
	{
		//	NOTE: since OrbitControls is active, altering the values in the controls will move the 
		//	camera around as OrbitControls stills sees the mouse motions as its events. This is harmless...
		
		var gui = new dat.GUI();
				
		var mixerFolder = gui.addFolder("AnimationMixerValues")
		var viewingFolder = gui.addFolder("ViewingValues")
		var directlightFolder = gui.addFolder("DirectionalLightValues")

		mixerFolder.add(mixerControls, "time").listen();
		mixerFolder.add(mixerControls, "timeScale", 0, 5).onChange(
			(timeScale) =>
			{
				mixer.timeScale = timeScale;
			}
		);
		mixerFolder.add(mixerControls, "stopAllAction").listen();
		
		viewingFolder.add(viewingControls, "intensityIncr", 0.0, 1.0);
		viewingFolder.add(viewingControls, "autoRotateSpeed", 0.0, 3.0);
		
		//	We could attach the change functions directly to these entries...but we don't...
		
		directlightFolder.add(directionalLightControls, "x", -100.0, 100.0);
		directlightFolder.add(directionalLightControls, "y", -100.0, 100.0);
		directlightFolder.add(directionalLightControls, "z", -100.0, 100.0);
		directlightFolder.add(directionalLightControls, "fov", 0, 90);
		directlightFolder.add(directionalLightControls, "target_x", -100.0, 100.0);
		directlightFolder.add(directionalLightControls, "target_y", -100.0, 100.0);
		directlightFolder.add(directionalLightControls, "target_z", -100.0, 100.0);
	}
	
	function setupTrackball(camera, renderer) 
	{
		var trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
		trackballControls.rotateSpeed = 1.0;
		trackballControls.zoomSpeed = 1.2;
		trackballControls.panSpeed = 0.8;
		trackballControls.noZoom = false;
		trackballControls.noPan = false;
		trackballControls.staticMoving = true;
		trackballControls.dynamicDampingFactor = 0.3;
		trackballControls.keys = [65, 83, 68];

		return trackballControls;
	}
		
	function setupWorld(worldRadius)
	{
		var sphereGeometry = new THREE.SphereGeometry(worldRadius, 100, 100);
		var sphereMaterial = new THREE.MeshPhongMaterial({
			color: 0xffffff
		});
		
		var textureLoader = new THREE.TextureLoader();
		sphereMaterial.map = textureLoader.load("./grasslight-big.jpg");
		sphereMaterial.map.wrapS = THREE.RepeatWrapping; 
		sphereMaterial.map.wrapT = THREE.RepeatWrapping; 
		
		//	Likely excessive...
		
		sphereMaterial.map.repeat.set(500,300);

		sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		sphere.receiveShadow = true;
		sphere.castShadow = false;
		sphere.rotation.z = -Math.PI / 2;
		
		sphere.position.y = -worldRadius;
		sphere.position.z = 2;
		
		return sphere;
	}

	function onWindowResize() 
	{
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function gltfload()
	{
		var loader = new THREE.GLTFLoader();
		
		loader.load("./BirdOneV5.glb", 
			(result) => 
			{
				//	onLoad. 'result' is the gltf object the loader returns to us...
				// 	The loader returns an entire Scene, with any models placed inside it...
				
				model = result.scene;
				
				scene.add(model)
				
				model.traverse((object) =>
				{
					//	Insure that all children get the cast shadow status...
					
					if (object.isMesh) 
					{
						object.castShadow = true;
					}
				});
							
				// 	The AnimationMixer is a player for animations on a particular object in the scene. 
				//	When multiple objects in the scene are animated independently, one AnimationMixer may be used for each object.
				//	Here, we have just the one...
				
				mixer = new THREE.AnimationMixer(model);
								
				//	If there is any animation data in the gltf .glb file, it gets stored in '.animations',
				//	in the form of an array of AnimationClips.
				//	To play the animations in a model we create an AnimationMixer. An AnimationMixer contains 1 or more AnimationActions. 
				//	An AnimationAction references an AnimationClip...

				animationAction = mixer.clipAction(result.animations[0]).play(); 
				animationAction.setLoop(THREE.LoopRepeat, 10);
				animationAction.clampWhenFinished = true;

				// add the animation controls...
				
				enableControls();
	
				//	Discover the uppermost altitude of the model. Save for the render loop...
				
				scene.traverse((scenery) =>
				{
					if ((scenery instanceof THREE.Group) && (scenery.name == 'Scene')) 
					{
						scenery.traverse((bird) =>
						{
							if ((bird instanceof THREE.Object3D) && (bird.name == 'BirdControl'))
							{
								birdMaxHeight = bird.position.y;
							}
						});
					}
				});
			}, 
			(xhr) =>
			{
				//	onProgress...
			
				console.log( `${ Math.round( xhr.loaded / xhr.total * 100 )}% loaded` );
			},
			(error) => 
			{
				//	onError...

				console.error('Yikes: ', error);
			} 
		);
	}	
	
	function render() 
	{
		stats.update();
		var delta = clock.getDelta();
		trackballControls.update(delta);
				
		sphere.rotation.x -= .00005;
		
		orbitControls.update(clock.getDelta());
		orbitControls.autoRotateSpeed = 1.0;
		
		//	Cycle through dark and light. Could be clouds, or moonlight...
		
		var ambientlighting = null;
		var directionallighting = null;
			
		scene.traverse((lighting) =>
		{
			if ((lighting instanceof THREE.AmbientLight) && (lighting.name == 'ambientLight')) 
			{
				ambientlighting = lighting;
			}
			
			if ((lighting instanceof THREE.DirectionalLight) && (lighting.name == 'directionalLight')) 
			{
				directionallighting = lighting;
			}

			//	We want to coordinate adjustments to lighting, but we can't do it asynchronously. So, we look for the two lights,
			//	find them, and then search for a known landmark, at the end of the array, which happens to be 'Scene'. 
			//	Nevertheless, we still insure we have our two lights...
			
			if ((lighting instanceof THREE.Group) && (lighting.name == 'Scene') && (ambientlighting != null) && (directionallighting != null)) 
			{
				if (darkening)
				{
					ambientlighting.intensity -= intensityIncrement;
					directionallighting.intensity -= intensityIncrement;
					
					scene.background.r += intensityIncrement;
					scene.background.g += intensityIncrement;
					scene.background.b += (intensityIncrement * 2);

					if ((ambientlighting.intensity <= 0) || (directionallighting.intensity <= lightingMinimum))
					{
						//	Cloudy...
						
						ambientlighting.intensity = lightingMinimum;
						directionallighting.intensity = lightingMinimum;
						darkening = false;
						dayInterval = 0;
					}
				}
				else if (lightening)
				{
					ambientlighting.intensity += intensityIncrement;
					directionallighting.intensity += intensityIncrement;
					
					scene.background.r -= intensityIncrement;
					scene.background.g -= intensityIncrement;
					scene.background.b -= (intensityIncrement * 2);

					
					if ((ambientlighting.intensity >= 1) || (directionallighting.intensity >= 1))
					{		
						//	Sunny...
						
						ambientlighting.intensity = 1;
						directionallighting.intensity = 1;
						lightening = false;
						dayInterval = 0;
					}
				}
				else
				{
					dayInterval += delta;
					if (dayInterval >= daySeconds)
					{
						lightening = ((ambientlighting.intensity <= lightingMinimum) || (directionallighting.intensity <= lightingMinimum));
						darkening = ((ambientlighting.intensity == 1) || (directionallighting.intensity == 1));
						dayInterval = 0;
					}
				}
			}
		});

		requestAnimationFrame(render);
		renderer.render(scene, camera)

		if (mixer) 
		{
			mixer.update(delta);
			
			if (mixerControls)
			{
				mixerControls.time = mixer.time;
			}
		}
		
		if (animationAction && mixerControls) 
		{
			//	Let the bird coast now and then. It will descend while resting, and will have to regain altitude...
			
			if ((animationAction.paused == true) && (soaringTimeSeconds > 0))
			{
				//	Soar a bit...
				
				scene.traverse((scenery) =>
				{
					if ((scenery instanceof THREE.Group) && (scenery.name == 'Scene')) 
					{
						scenery.traverse((bird) =>
						{
							if ((bird instanceof THREE.Object3D) && (bird.name == 'BirdControl'))
							{
								if (bird.position.y > birdMinHeight)
								{									
									bird.position.y -= birdIncrement;
								}
								else 
								{
									//	Bottomed out. Climb back up...
									
									soaringTimeSeconds = delta;
								}
							}
						});
					}
				});
				
				soaringTimeSeconds -= delta;
				
				if (soaringTimeSeconds <= 0)
				{
					//	Rested?...
										
					animationAction.setLoop(THREE.LoopRepeat, Math.floor(Math.random() * 10));
					animationAction.reset();
					soaringTimeSeconds = Math.floor(Math.random() * 10) + 1;
				}
			}
			else
			{
				//	We're ascending or near the ceiling...
				
				scene.traverse((scenery) =>
				{
					if ((scenery instanceof THREE.Group) && (scenery.name == 'Scene')) 
					{
						scenery.traverse((bird) =>
						{
							if ((bird instanceof THREE.Object3D) && (bird.name == 'BirdControl'))
							{
								if (bird.position.y < (birdMaxHeight + (Math.random() * 10)))
								{
									bird.position.y += birdIncrement;
								}
							}
						});
					}
				});
			}

			mixerControls.effectiveTimeScale = animationAction.getEffectiveTimeScale();
			mixerControls.effectiveWeight = animationAction.getEffectiveWeight();
			intensityIncrement = viewingControls.intensityIncr;
			orbitControls.autoRotateSpeed = viewingControls.autoRotateSpeed;
						
			//	Aid for solving some problems with directional lighting...
			
			//	Position the directional light...
			
			directionalLight.position.set(directionalLightControls.x, directionalLightControls.y, directionalLightControls.z);
			
			directionalLight.shadow.camera.fov = directionalLightControls.fov;

			//	Avoid churning memory by only allocating objects if something has changed. Recall that position in
			//	Object3D in immutable, so we have to allocate new objects to alter the light target...
			
			if ((directionalLightControls.target_x != directionalLight.target.position.x) || 
			(directionalLightControls.target_y != directionalLight.target.position.y) || 
			(directionalLightControls.target_z != directionalLight.target.position.z))
			{
				var ctarget = new THREE.Object3D();
				var cposition = new THREE.Vector3(directionalLightControls.target_x, directionalLightControls.target_y, directionalLightControls.target_z);
				ctarget.position.copy(cposition);
				directionalLight.target = ctarget;
			}
		}
	}   
}