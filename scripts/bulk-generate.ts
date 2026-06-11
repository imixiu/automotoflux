import { neon } from "@neondatabase/serverless";

const SITE = "automotoflux";
const TARGET = parseInt(process.env.TARGET_ARTICLES || "500");

const categories = ["engine-parts", "exterior-accessories", "interior-upgrades", "wheels-tires", "electrical-systems", "maintenance-tools"];

const authorsByCategory: Record<string, string[]> = {
  "engine-parts": ["Marcus Chen", "Robert Fernandez"],
  "exterior-accessories": ["Sarah Mitchell", "Nina Volkov"],
  "interior-upgrades": ["James Henderson", "Rachel Torres"],
  "wheels-tires": ["Rachel Torres", "Marcus Chen"],
  "electrical-systems": ["David Kowalski", "Marcus Chen"],
  "maintenance-tools": ["Lisa Park", "Robert Fernandez"],
};

const titleTemplates: Record<string, string[]> = {
  "engine-parts": [
    "How to Replace Your {part} Without a Mechanic: Step-by-Step Guide",
    "Best {brand} {part} Upgrades for {vehicle} Owners in {year}",
    "{number} Signs Your {part} Needs Immediate Replacement",
    "Cold Air Intake vs {part}: Which Performance Upgrade Is Worth It?",
    "How a High-Performance {part} Adds {hp}hp to Your {vehicle}",
    "The Complete Guide to {engine_type} Engine {part} Maintenance",
    "{brand} vs {brand2}: Which {part} Brand Lasts Longer?",
    "Why Your {vehicle} Needs a {part} Upgrade Before Next Winter",
    "Turbocharger vs Supercharger: Making the Right Choice for Your {vehicle}",
    "{number} Engine Parts You Should Replace Every {miles} Miles",
    "How to Choose the Right {part} for Your {engine_type} Engine",
    "DIY {part} Replacement: Tools, Tips, and Common Mistakes",
  ],
  "exterior-accessories": [
    "Best Body Kits for {vehicle} Under ${price} in {year}",
    "How to Install {accessory} on Your {vehicle} in {time}",
    "{number} Exterior Upgrades That Dramatically Transform Your {vehicle}",
    "LED vs HID Headlights: The Ultimate Comparison for {vehicle} Owners",
    "How Paint Protection Film Saves You Thousands in {vehicle} Repairs",
    "The Best {brand} {accessory} for Off-Road {vehicle} Owners",
    "Roof Rack Buying Guide: {number} Options for Every {vehicle} Type",
    "How to Protect Your {vehicle}'s Paint in {season} Weather",
    "{brand} vs {brand2} Window Tint: Which Is Better for {climate} Climates?",
    "Front Splitter vs Rear Diffuser: Aerodynamics Explained for {vehicle}",
    "{number} Lighting Upgrades Every {vehicle} Driver Should Consider",
    "How to Choose the Right Running Boards for Your {vehicle}",
  ],
  "interior-upgrades": [
    "Best Seat Covers for {vehicle} Under ${price}: Comfort Meets Durability",
    "How to Install a {accessory} in Your {vehicle} Dashboard",
    "{number} Interior Upgrades That Make Your {vehicle} Feel Brand New",
    "Best Aftermarket Steering Wheels for {vehicle} Enthusiasts",
    "How Sound Deadening Material Transforms Your {vehicle} Cabin",
    "The Complete {vehicle} Interior Refresh Guide for {year}",
    "{brand} vs {brand2} Dash Cam: Which Offers Better {feature} Protection?",
    "How to Upgrade Your {vehicle}'s Audio System Without Replacing Factory Head Unit",
    "Custom Floor Mats vs All-Weather Liners: Which Protects Your {vehicle} Better?",
    "{number} Smart Gadgets That Upgrade Your {vehicle} Cabin Experience",
    "How to Add Apple CarPlay to Any {vehicle} with Aftermarket {accessory}",
    "The Best {vehicle} Seat Organization Accessories for Long Trips",
  ],
  "wheels-tires": [
    "Best Tires for {vehicle} in {season} Conditions: {year} Guide",
    "How to Read Tire Sizes: A Complete Guide for {vehicle} Owners",
    "{brand} vs {brand2} Tires: Performance Test on {vehicle}",
    "{number} Signs It's Time to Replace Your {vehicle}'s Tires",
    "All-Season vs All-Terrain Tires for {vehicle}: Which Should You Choose?",
    "How Wheel Offset Affects Your {vehicle}'s Handling and Clearance",
    "The Best {size}-Inch Aftermarket Wheels for {vehicle}",
    "How to Properly Balance and Rotate Tires on Your {vehicle}",
    "Run-Flat Tires: Are They Worth It for {vehicle} Owners?",
    "{number} Wheel Finishes Ranked for Durability and Style",
    "TPMS Sensors: Everything {vehicle} Owners Need to Know",
    "How to Choose the Right Tire Pressure for Your {vehicle}",
  ],
  "electrical-systems": [
    "How to Diagnose a Failing {component} in Your {vehicle}",
    "Best Aftermarket Batteries for {vehicle}: {number} Options Tested",
    "{brand} vs {brand2} Alternator: Which Lasts Longer in {vehicle}?",
    "How to Install a {component} in Your {vehicle} Without an Electrician",
    "{number} Signs Your {vehicle}'s {component} Is About to Fail",
    "Complete Guide to {vehicle} Fuse Box: Locations and Functions",
    "How Modern {vehicle} Electronics Affect Fuel Economy",
    "OBD2 Scanner Buying Guide for {vehicle} DIY Mechanics",
    "How to Upgrade Your {vehicle}'s {component} for Better Performance",
    "Solar Trickle Chargers for {vehicle}: Do They Actually Work?",
    "The Best {component} Brands for High-Mileage {vehicle} Owners",
    "How to Fix Common Electrical Gremlins in Your {vehicle}",
  ],
  "maintenance-tools": [
    "Best {tool} for Home Mechanics Working on {vehicle}",
    "{number} Essential Tools Every {vehicle} Owner Needs in Their Garage",
    "How to Use a {tool} to Save ${price} on {vehicle} Repairs",
    "{brand} vs {brand2} {tool}: Which Offers Better Value?",
    "Complete Oil Change Guide for {vehicle}: Tools and Step-by-Step Process",
    "How to Build the Perfect Home Garage for {vehicle} Maintenance",
    "The {number} Best Torque Wrenches for {vehicle} DIY Work",
    "Floor Jack Buying Guide: Capacity and Safety for Your {vehicle}",
    "How to Properly Use a {tool} Without Damaging Your {vehicle}",
    "{number} Specialty Tools That Make {vehicle} Maintenance Easy",
    "Best Mechanic's Tool Sets Under ${price} for Beginner {vehicle} Owners",
    "How to Diagnose {vehicle} Problems with a Basic {tool}",
  ],
};

const fillWords: Record<string, string[]> = {
  brand: ["Gates", "Bosch", "NGK", "ACDelco", "Dorman", "Mishimoto", "K&N", "Edelbrock", "AEM", "Magnaflow", "Flowmaster", "Bilstein", "KYB", "Monroe", "Moog"],
  brand2: ["Denso", "Champion", "Motorcraft", "Fel-Pro", "Permatex", "Eibach", "Tokico", "Gabriel", "Sachs", "Goodyear", "Michelin", "Continental", "Bridgestone", "Pirelli", "Yokohama"],
  vehicle: ["truck", "SUV", "sedan", "muscle car", "crossover", "pickup", "sports car", "jeep", "minivan", "hatchback"],
  part: ["timing belt", "water pump", "alternator", "starter motor", "fuel pump", "catalytic converter", "oxygen sensor", "mass airflow sensor", "throttle body", "camshaft"],
  accessory: ["dash cam", "front grille", "running boards", "roof rack", "side mirrors", "bug deflector", "tonneau cover", "mud flaps", "car bra", "spoiler"],
  component: ["battery", "alternator", "starter", "serpentine belt", "fuse", "relay", "ground strap", "voltage regulator"],
  tool: ["torque wrench", "OBD2 scanner", "floor jack", "impact driver", "ratchet set", "multimeter", "compression tester", "vacuum gauge"],
  engine_type: ["V6", "V8", "turbocharged", "diesel", "4-cylinder", "inline-6", "flat-4"],
  season: ["winter", "summer", "all-season", "wet weather"],
  climate: ["hot", "cold", "rainy", "desert"],
  feature: ["accident", "theft", "parking"],
  size: ["17", "18", "19", "20", "22"],
  number: ["3", "5", "7", "8", "10", "12"],
  hp: ["15", "20", "30", "45", "60"],
  miles: ["30,000", "50,000", "60,000", "100,000"],
  miles2: ["5,000", "7,500", "10,000"],
  price: ["100", "200", "300", "500", "750"],
  time: ["under 30 minutes", "1 hour", "an afternoon"],
  year: ["2025", "2026"],
};

const intros: Record<string, string[]> = {
  "engine-parts": [
    "The engine is the heart of your vehicle, and keeping it in optimal condition is the single most important thing you can do to extend its life and performance. Whether you're dealing with a worn component or looking to squeeze out more power, understanding your engine parts is the foundation of smart automotive ownership.",
    "Engine maintenance isn't just about oil changes. The dozens of interconnected components working inside your engine block require attention and periodic replacement to prevent catastrophic failures. Knowing which parts to watch and when to act can save you thousands in repair bills.",
    "Performance enthusiasts and daily drivers alike benefit from understanding their engine components. From intake systems to exhaust manifolds, every part plays a role in how your vehicle runs, feels, and performs under different driving conditions.",
  ],
  "exterior-accessories": [
    "Your vehicle's exterior is its first impression, and the right accessories protect your investment while expressing your personal style. From aerodynamic enhancements to practical protection solutions, the aftermarket exterior market has never offered more choices.",
    "Exterior accessories serve dual purposes: they enhance the visual appeal of your vehicle while providing practical protection against road debris, weather, and daily wear. The best upgrades combine form and function seamlessly.",
    "Whether you drive a rugged pickup that faces trail abuse or a daily commuter that needs protection from urban hazards, exterior accessories can transform both the look and utility of your vehicle without a showroom price tag.",
  ],
  "interior-upgrades": [
    "You spend more time inside your vehicle than outside it, which makes interior quality directly tied to your driving enjoyment. Modern aftermarket interior upgrades range from practical organization solutions to technology integrations that rival luxury vehicles.",
    "The factory interior of most vehicles is a compromise between cost and comfort. Aftermarket upgrades let you prioritize what matters to you — whether that's better seating support, cleaner audio, improved technology integration, or simply a fresher aesthetic.",
    "Interior upgrades don't require a complete overhaul to make a significant difference. Strategic additions — a quality dash cam, better floor protection, improved audio, or smarter organization — can dramatically change how you experience your daily drive.",
  ],
  "wheels-tires": [
    "Tires are the only contact point between your vehicle and the road, making them arguably the most critical safety component you can invest in. The right tire selection for your vehicle and driving conditions can dramatically improve handling, braking, and fuel economy.",
    "Wheels and tires are where style meets safety in automotive customization. The right fitment enhances your vehicle's stance and performance characteristics, while the wrong choice can compromise handling and cause premature wear.",
    "Understanding tire technology has never been more important. Modern compounds, construction techniques, and tread patterns are engineered for specific performance envelopes — choosing correctly requires understanding both your vehicle's requirements and your driving environment.",
  ],
  "electrical-systems": [
    "Modern vehicles contain more electronics than a commercial airliner did thirty years ago. The electrical system that powers everything from your engine management computer to your USB charging ports requires proper maintenance to keep your vehicle running reliably.",
    "Electrical failures are among the most frustrating automotive problems — intermittent issues can be difficult to diagnose, and failures often occur at the worst possible moments. Understanding your vehicle's electrical architecture helps you spot problems early.",
    "From the battery that starts your engine to the network of sensors that manage fuel injection, the electrical system is the nervous system of your vehicle. A proactive approach to electrical maintenance prevents the cascade of failures that result from ignoring warning signs.",
  ],
  "maintenance-tools": [
    "Having the right tools transforms complex automotive repairs from intimidating projects into manageable DIY tasks. A well-equipped home garage gives you independence from dealer service schedules and can save thousands of dollars annually.",
    "Professional mechanics don't achieve faster, more reliable results because of skill alone — the right tools make all the difference. Investing in quality automotive tools pays dividends across every repair and maintenance task you'll ever undertake.",
    "The barrier between a successful DIY repair and an expensive mistake is often a single missing tool. Building a comprehensive tool collection systematically, starting with the essentials and expanding to specialty equipment, sets you up for automotive self-sufficiency.",
  ],
};

const sections: Record<string, {h: string; p: string}[]> = {
  "engine-parts": [
    {h: "Understanding Engine Component Lifespan", p: "Every engine component has a designed service interval, and most manufacturers specify replacement schedules based on mileage or time. Timing belts typically require replacement every 60,000-100,000 miles, while spark plugs might last 30,000 miles for copper types or 100,000+ for platinum and iridium varieties. Understanding these intervals prevents the catastrophic failures that result from deferred maintenance."},
    {h: "OEM vs Aftermarket: Making the Right Choice", p: "The choice between OEM (Original Equipment Manufacturer) and aftermarket components depends on your goals and budget. OEM parts guarantee fitment compatibility and meet factory specifications, while quality aftermarket brands often offer equivalent or superior materials at lower prices. For performance applications, aftermarket parts from reputable manufacturers frequently exceed factory specifications."},
    {h: "How to Read Diagnostic Codes", p: "Modern vehicles monitor engine components through dozens of sensors, and when something fails, the check engine light illuminates and stores a diagnostic trouble code (DTC). A basic OBD2 scanner retrieves these codes, pointing you directly to the affected system. Understanding how to interpret these codes is the first step in any engine repair."},
    {h: "Performance Upgrades That Actually Work", p: "Not every aftermarket upgrade delivers meaningful performance gains. Cold air intakes, high-flow air filters, and cat-back exhaust systems offer real improvements for naturally aspirated engines. Turbo vehicles benefit most from boost controllers, upgraded intercoolers, and supporting fueling modifications. Always research dyno-proven results before investing in performance parts."},
    {h: "Cooling System Maintenance Essentials", p: "The cooling system works in concert with nearly every other engine component. A failing water pump or worn thermostat can cause overheating that damages head gaskets, warps cylinder heads, and permanently affects engine performance. Flushing coolant every 30,000 miles and inspecting hoses annually prevents the majority of cooling system failures."},
    {h: "Fuel System Components Explained", p: "The fuel system — from tank to injectors — requires clean fuel and proper pressure to deliver optimal combustion. Clogged fuel filters starve engines of fuel under load, worn injectors cause misfires and rich running conditions, and failing fuel pumps leave you stranded. Regular filter replacement and fuel system cleaners extend the life of these precision components."},
  ],
  "exterior-accessories": [
    {h: "Paint Protection: Your First Line of Defense", p: "Paint protection film (PPF) is the most comprehensive solution for protecting your vehicle's finish from rock chips, scratches, and road debris. High-quality urethane films are self-healing, UV-resistant, and virtually invisible. Ceramic coatings offer a more affordable alternative with impressive hydrophobic properties and gloss enhancement, though they provide less physical impact protection."},
    {h: "Lighting Upgrades: Safety and Style Combined", p: "LED lighting upgrades offer massive improvements in visibility, color temperature, and energy efficiency over factory halogen bulbs. Aftermarket LED headlights produce up to three times more light output with lower current draw. Light bars and auxiliary driving lights are popular for off-road vehicles, providing broad illumination that factory lights can't match on dark trails."},
    {h: "Aerodynamic Accessories and Their Real Effects", p: "Aerodynamic accessories range from purely aesthetic to genuinely functional. Front splitters, rear diffusers, and roof spoilers are engineered components that affect downforce, drag coefficient, and high-speed stability. Body kits that lower and widen the vehicle stance can improve handling by lowering the center of gravity, though improperly designed kits can actually increase lift at highway speeds."},
    {h: "Truck Bed Accessories for Working Vehicles", p: "Truck owners have an enormous selection of bed accessories that improve utility without sacrificing style. Tonneau covers protect cargo from weather and theft while improving fuel economy by reducing aerodynamic drag. Bed liners — spray-on or drop-in — protect against scratches and rust. Cargo management systems, tie-down points, and tool boxes maximize the bed's utility for both work and recreation."},
    {h: "Window Treatments: Tint and Beyond", p: "Window tinting reduces heat buildup, protects your interior from UV damage, and provides privacy. Ceramic tint films offer superior heat rejection compared to dyed films without interfering with electronic signals from TPMS sensors, GPS, or cell reception. Local regulations govern visible light transmission percentages, so research your jurisdiction's legal limits before installation."},
  ],
  "interior-upgrades": [
    {h: "Seat Comfort and Ergonomics", p: "Factory seats are designed to accommodate a wide range of body types, which means they're optimized for none of them. Aftermarket seat upgrades — from bolstered sport seats to luxury reclining captain's chairs — can eliminate fatigue on long drives. Seat cushions and lumbar support additions offer budget-friendly improvements without full seat replacement."},
    {h: "Audio System Architecture", p: "A quality audio upgrade follows a logical path: source unit, signal processing, amplification, and speakers. Even with a factory head unit, adding a DSP (Digital Signal Processor) dramatically improves audio quality by correcting time alignment and frequency response. Component speaker systems with dedicated tweeters and mid-bass drivers outperform factory coaxials significantly."},
    {h: "Dash Camera Integration", p: "Dash cameras have transitioned from optional accessories to essential safety equipment. Modern units offer 4K front recording, wide-angle rear cameras, parking surveillance modes, and cloud connectivity. Hardwired installations draw from the vehicle's battery through low-voltage protection modules, enabling continuous parking recording without battery drain concerns."},
    {h: "Technology Integration Solutions", p: "Keeping older vehicles current with modern technology is achievable through aftermarket integration. Apple CarPlay and Android Auto adapters bring smartphone connectivity to vehicles that predate these standards. Wireless charging pads, USB-C hub installations, and digital rearview mirrors significantly enhance the technology experience without replacing factory units."},
    {h: "Noise Reduction and Comfort Materials", p: "Road, wind, and powertrain noise intrude into the cabin through body panels, firewall gaps, and floor pan vibrations. Mass-loaded vinyl and closed-cell foam deadening materials applied to doors, floors, and trunk dramatically reduce noise transmission. The result is a quieter, more refined driving environment that makes audio systems sound significantly better at lower volumes."},
  ],
  "wheels-tires": [
    {h: "Tire Construction and Technology", p: "Modern tire construction is more sophisticated than most drivers realize. Radial plies, steel belts, silica-enhanced compounds, and asymmetric tread patterns work together to balance grip, wear resistance, noise, and fuel efficiency. Premium tire manufacturers invest billions in compound research, with the differences between budget and premium tires most apparent in wet braking distances and handling at the limit."},
    {h: "Understanding Wheel Fitment", p: "Wheel fitment involves more than matching bolt patterns. Offset — the distance between the wheel's mounting face and its centerline — determines how far the wheel sits inward or outward. Improper offset causes clearance issues with brake calipers and suspension components, or excessive stress on wheel bearings. A positive offset tucks the wheel inward; negative offset creates the aggressive 'poke' stance popular in off-road builds."},
    {h: "Seasonal Tire Strategy", p: "Three-peak mountain snowflake (3PMSF) rated winter tires outperform all-season tires in cold temperatures due to specialized rubber compounds that remain pliable below 45°F. The stopping distance difference between summer and winter tires in snowy conditions can exceed 40% — a potentially life-saving gap. Dedicated winter wheels make seasonal swaps faster and preserve your primary wheel's finish."},
    {h: "Tire Maintenance for Maximum Life", p: "Proper inflation extends tire life and improves fuel efficiency. Under-inflation is the leading cause of premature tire wear and heat buildup that weakens carcass structure. Rotation every 5,000-7,500 miles equalizes wear across all four tires. Wheel alignment checks after hitting significant road hazards prevent uneven wear patterns that can cut tire life in half."},
    {h: "High-Performance Tire Selection", p: "Ultra-high performance (UHP) and max performance summer (MPS) tires are engineered for precise handling and maximum grip. These tires sacrifice wear life, wet-weather performance in cold conditions, and comfort for exceptional cornering ability. Track day enthusiasts often run separate tire sets, preserving street tires for commuting while track-specific tires handle the demands of performance driving."},
  ],
  "electrical-systems": [
    {h: "Battery Technology and Selection", p: "Starting batteries, absorbed glass mat (AGM) batteries, and lithium iron phosphate (LiFePO4) batteries each offer different trade-offs. AGM batteries handle deep discharges better than flooded lead-acid units, making them ideal for vehicles with stop-start systems or heavy accessory loads. Lithium batteries offer dramatic weight savings but require compatible charging systems."},
    {h: "Alternator Output and Charging Systems", p: "The alternator maintains battery charge while powering all electrical loads during engine operation. High-output aftermarket alternators are essential for vehicles with upgraded audio systems, lighting, or winches that exceed factory alternator capacity. Signs of alternator wear include dim headlights under load, battery warning lights, and voltage readings below 13.5 volts with the engine running."},
    {h: "Modern Vehicle Networks and Modules", p: "Contemporary vehicles communicate through controller area network (CAN bus) protocols that connect dozens of electronic control units. The engine control module (ECM), transmission control module (TCM), body control module (BCM), and anti-lock brake module all exchange data continuously. Diagnosing faults in these systems requires understanding not just the failing component but how it interacts with the vehicle's communication network."},
    {h: "Aftermarket Electronics Integration", p: "Adding aftermarket electronics to modern vehicles requires careful attention to the factory wiring architecture. Direct tap connectors, load equalizers for LED lighting swaps, and T-harness installations allow accessory additions without cutting factory wires. Maintaining factory wiring integrity preserves resale value and prevents the intermittent faults that result from poor splicing."},
    {h: "Sensor Systems and Engine Management", p: "Mass airflow sensors, oxygen sensors, crankshaft position sensors, and manifold absolute pressure sensors continuously feed data to the engine control module. Degraded sensors cause rich or lean running conditions, rough idle, reduced performance, and poor fuel economy before triggering check engine lights. Cleaning sensors with specialized products often restores function without replacement."},
  ],
  "maintenance-tools": [
    {h: "Building Your Tool Collection Strategically", p: "The most cost-effective approach to building a tool collection starts with quality basics and expands as specific needs arise. A quality 3/8-inch drive socket set with standard and deep sockets, combination wrenches in SAE and metric, and a quality torque wrench handle the vast majority of maintenance tasks. Resist the temptation to buy large, cheap sets — individual quality tools outlast inexpensive sets many times over."},
    {h: "Diagnostic Tools for Modern Vehicles", p: "An OBD2 scanner is arguably the most valuable tool in any home mechanic's arsenal. Entry-level scanners read and clear trouble codes; advanced units display live sensor data, perform bidirectional control tests, and cover manufacturer-specific codes beyond the generic OBD2 standard. Combining a scanner with a quality digital multimeter addresses the majority of electrical diagnosis tasks."},
    {h: "Safety Equipment for Home Repair", p: "Proper safety equipment prevents the accidents that send home mechanics to emergency rooms. Quality floor jacks and jack stands rated for your vehicle's weight, wheel chocks, and a fire extinguisher are non-negotiable. Never work under a vehicle supported only by a floor jack — jack stands properly positioned on frame rails are the only safe way to elevate a vehicle for undercar work."},
    {h: "Specialty Tools That Pay for Themselves", p: "Certain specialty tools enable DIY repairs that would otherwise require expensive shop visits. Brake caliper wind-back tools, harmonic balancer pullers, fuel line disconnect sets, and spring compressors address specific systems that are impossible to work on safely without the correct equipment. Renting specialty tools from auto parts stores is economical for one-time jobs."},
    {h: "Air Tools vs Electric Tools", p: "Cordless impact wrenches have largely closed the performance gap with pneumatic tools, offering the convenience of portability without compressor requirements. High-torque 20V and 40V impact wrenches handle lug nuts and stubborn fasteners that manual tools can't break loose. For high-volume work or sustained use, pneumatic tools still offer advantages in power-to-weight ratio and heat dissipation."},
  ],
};

const lists: Record<string, string[]> = {
  "engine-parts": [
    "<h2>Key Takeaways</h2><ul><li>Follow manufacturer service intervals — deferred maintenance costs more than prevention</li><li>Quality aftermarket parts from reputable brands often match or exceed OEM specifications</li><li>Learn to read OBD2 codes before any repair to avoid chasing symptoms</li><li>Performance upgrades should be tuned together as a system, not added individually</li><li>Document all repairs and replacements to track component age and resale value</li></ul>",
    "<h2>Mistakes to Avoid</h2><ul><li>Using cheap fluids that don't meet manufacturer specifications</li><li>Ignoring small leaks until they become catastrophic failures</li><li>Reusing one-time-use gaskets, crush washers, or fasteners</li><li>Skipping torque specifications when installing critical engine components</li><li>Neglecting to bleed air from cooling system after repairs</li></ul>",
  ],
  "exterior-accessories": [
    "<h2>Key Takeaways</h2><ul><li>Match accessories to your vehicle's primary use case — daily driver needs differ from off-road rigs</li><li>Quality installation matters as much as product quality for lasting results</li><li>Check local laws before installing lighting or tinting accessories</li><li>Aerodynamic accessories must be properly engineered to provide real benefits</li><li>Protect paint before applying vinyl wraps or bed liner coatings</li></ul>",
    "<h2>Mistakes to Avoid</h2><ul><li>Installing accessories that exceed payload or towing ratings</li><li>Skipping surface preparation before applying any adhesive accessories</li><li>Choosing style over function for accessories that affect safety systems</li><li>Using cheap LED conversion kits that produce glare without proper aim</li><li>Installing body kits that prevent proper bumper energy absorption in accidents</li></ul>",
  ],
  "interior-upgrades": [
    "<h2>Key Takeaways</h2><ul><li>Audio upgrades deliver the most noticeable improvement per dollar spent</li><li>Technology integration should maintain factory safety system compatibility</li><li>Proper installation ensures warranties remain valid on factory components</li><li>Sound deadening amplifies the benefit of every other interior upgrade</li><li>Choose materials rated for automotive temperature extremes</li></ul>",
    "<h2>Mistakes to Avoid</h2><ul><li>Tapping into airbag wiring circuits for power or accessory connections</li><li>Installing accessories that obstruct driver visibility or airbag deployment zones</li><li>Using consumer-grade audio equipment not rated for automotive power supply noise</li><li>Choosing decorative accessories over functional ones for daily use vehicles</li><li>Ignoring moisture and UV resistance ratings for interior materials</li></ul>",
  ],
  "wheels-tires": [
    "<h2>Key Takeaways</h2><ul><li>Never mix tire types — use four matching tires whenever possible</li><li>Proper inflation is the single most impactful tire maintenance habit</li><li>Load index and speed rating must meet or exceed vehicle requirements</li><li>Wheel offset changes affect handling and may require suspension modification</li><li>Replace tires before they reach legal minimum tread depth for wet-weather safety</li></ul>",
    "<h2>Mistakes to Avoid</h2><ul><li>Choosing wheels based solely on appearance without checking fitment specifications</li><li>Ignoring wheel weight's effect on handling and unsprung mass</li><li>Installing tires with incorrect speed ratings for your vehicle's top speed capability</li><li>Skipping TPMS sensor replacement when changing to aftermarket wheels</li><li>Mixing tire sizes that create drivetrain stress on AWD vehicles</li></ul>",
  ],
  "electrical-systems": [
    "<h2>Key Takeaways</h2><ul><li>Always disconnect the battery negative terminal before working on electrical systems</li><li>Voltage readings are the fastest way to diagnose most electrical faults</li><li>Proper fusing protects wiring from fires — never bypass or oversize fuses</li><li>Modern vehicle computers may require relearning procedures after battery disconnection</li><li>Document wiring modifications with clear diagrams for future reference</li></ul>",
    "<h2>Mistakes to Avoid</h2><ul><li>Using undersized wire gauge for high-current accessories like audio amplifiers</li><li>Grounding accessories to body sheet metal instead of chassis ground points</li><li>Ignoring parasitic draw symptoms — unusual battery drain always has a root cause</li><li>Installing aftermarket accessories that interfere with factory CAN bus communication</li><li>Skipping dielectric grease on electrical connections in exposed locations</li></ul>",
  ],
  "maintenance-tools": [
    "<h2>Key Takeaways</h2><ul><li>Buy quality tools once rather than cheap tools repeatedly</li><li>Torque specifications exist for a reason — invest in a calibrated torque wrench</li><li>Safety equipment is non-negotiable — never improvise support under a raised vehicle</li><li>Specialty tools often pay for themselves on the first job they enable</li><li>Keep tools organized and clean — they'll last decades with proper care</li></ul>",
    "<h2>Mistakes to Avoid</h2><ul><li>Using adjustable wrenches where proper fitting wrenches are required</li><li>Working on hot engines where heat causes personal injury and part damage</li><li>Rushing repairs without reading vehicle-specific procedures first</li><li>Skipping penetrating oil on rusted fasteners — damaged threads cost far more than time</li><li>Borrowing or renting tools for recurring maintenance — buy the right tool and keep it</li></ul>",
  ],
};

const quotes: Record<string, {q: string; a: string}[]> = {
  "engine-parts": [
    {q: "The engine doesn't lie — every symptom tells a story if you know how to listen.", a: "Marcus Chen, Master Technician"},
    {q: "Preventive maintenance isn't an expense. It's insurance against far larger bills.", a: "Robert Fernandez, Motorsport Engineer"},
  ],
  "exterior-accessories": [
    {q: "The best exterior modification is one that looks factory — purposeful without being excessive.", a: "Sarah Mitchell, Automotive Journalist"},
    {q: "Paint protection is the most overlooked aspect of vehicle ownership. The cost of repairing clear coat damage dwarfs prevention.", a: "Nina Volkov, Materials Scientist"},
  ],
  "interior-upgrades": [
    {q: "You spend thousands of hours inside your vehicle. Investing in interior quality pays back in daily satisfaction.", a: "James Henderson, Interior Specialist"},
    {q: "A well-executed audio upgrade transforms the commute from obligation to experience.", a: "Rachel Torres, Automotive Consultant"},
  ],
  "wheels-tires": [
    {q: "Your tires are in contact with the road — everything else in your car works through them. There is no more important safety upgrade.", a: "Rachel Torres, Tire Industry Consultant"},
    {q: "Proper wheel fitment is engineering, not just aesthetics. Get it wrong and you're fighting physics every mile.", a: "Marcus Chen, Master Technician"},
  ],
  "electrical-systems": [
    {q: "The modern vehicle is a computer with wheels. Understanding its electrical architecture is as important as understanding its mechanical systems.", a: "David Kowalski, Automotive Electrical Engineer"},
    {q: "Most electrical problems trace back to bad grounds and corroded connections — simple maintenance prevents the majority of failures.", a: "Marcus Chen, Master Technician"},
  ],
  "maintenance-tools": [
    {q: "The right tool makes a difficult job easy. The wrong tool makes an easy job impossible.", a: "Lisa Park, DIY Maintenance Expert"},
    {q: "A quality floor jack stand and proper jack stands are the most important safety investment any home mechanic can make.", a: "Robert Fernandez, Motorsport Engineer"},
  ],
};

const endings: Record<string, string[]> = {
  "engine-parts": [
    "Your engine's longevity depends on consistent attention and quality parts. Whether you're handling routine maintenance yourself or managing professional repairs, understanding what's inside your engine enables better decisions at every service interval.",
    "The investment in proper engine maintenance pays exponential dividends in vehicle longevity and reliability. Bookmark our engine parts section for ongoing guides, product reviews, and troubleshooting resources.",
  ],
  "exterior-accessories": [
    "The right exterior accessories protect your investment while expressing your vehicle's personality. Start with the modifications that address your primary use case, build quality over quantity, and enjoy the process of making your vehicle uniquely yours.",
    "From daily drivers to weekend warriors, exterior upgrades connect the vehicle to its purpose. Explore our exterior accessories section for the latest product reviews and installation guides.",
  ],
  "interior-upgrades": [
    "Interior upgrades pay back in daily driving satisfaction. Start with the modifications that address your biggest frustrations — whether that's poor audio, uncomfortable seating, or outdated technology — and build from there.",
    "The cabin is where you spend your time behind the wheel. Investing in a comfortable, connected, and well-organized interior transforms every journey from obligation to experience.",
  ],
  "wheels-tires": [
    "Your tire and wheel choice affects every aspect of your vehicle's behavior. Take the time to research properly, invest in quality, and maintain your tires diligently. The safety margins they provide are worth every dollar.",
    "The right wheel and tire combination can transform your vehicle's character — improving handling, aesthetics, and safety simultaneously. Explore our wheels and tires section for expert guidance on fitment and product selection.",
  ],
  "electrical-systems": [
    "Electrical reliability underpins everything else your vehicle does. Proactive maintenance of batteries, alternators, and wiring systems prevents the failures that leave you stranded and creates a foundation of reliability for any accessory additions.",
    "As vehicles become increasingly electronic, understanding and maintaining these systems becomes more valuable. Our electrical systems guides provide the knowledge to diagnose, repair, and upgrade with confidence.",
  ],
  "maintenance-tools": [
    "A well-equipped garage returns its investment many times over in avoided labor costs and the satisfaction of self-sufficiency. Build your collection thoughtfully, invest in quality where it matters, and enjoy the capabilities that the right tools provide.",
    "The skills and tools to maintain your own vehicle represent genuine independence from dealership schedules and inflated labor rates. Explore our tools section for recommendations at every skill and budget level.",
  ],
};

function fill(template: string): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const words = fillWords[key];
    if (!words) return key;
    return words[Math.floor(Math.random() * words.length)];
  });
}

function slugify(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateArticle(category: string) {
  const template = pick(titleTemplates[category]);
  const title = fill(template);
  const slug = slugify(title);

  const introText = pick(intros[category]);
  const sectionPool = [...sections[category]].sort(() => Math.random() - 0.5).slice(0, 4);
  const sectionHtml = sectionPool.map(s => `<h2>${s.h}</h2>\n<p>${s.p}</p>`);
  const quoteData = pick(quotes[category]);
  const quoteHtml = `<blockquote><p>"${quoteData.q}"</p><cite>— ${quoteData.a}</cite></blockquote>`;
  const listHtml = pick(lists[category]);
  const endingText = pick(endings[category]);

  const body = [
    `<p>${introText}</p>`,
    ...sectionHtml.slice(0, 2),
    quoteHtml,
    ...sectionHtml.slice(2),
    listHtml,
    `<p>${endingText}</p>`,
  ].join("\n\n");

  const description = introText.substring(0, 155) + "...";
  return { title, slug, description, body };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
  const sql = neon(url);

  const perCategory = Math.ceil(TARGET / categories.length);
  let total = 0;

  for (const category of categories) {
    const authors = authorsByCategory[category];
    for (let i = 0; i < perCategory; i++) {
      const article = generateArticle(category);
      const author = pick(authors);
      const daysAgo = Math.floor(Math.random() * 365);
      const pubDate = new Date(Date.now() - daysAgo * 86400000).toISOString();

      try {
        await sql(
          `INSERT INTO articles (site, type, title, short_title, description, body, author, published_time, is_online, language)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Y', 'en')
           ON CONFLICT DO NOTHING`,
          [SITE, category, article.title, article.slug, article.description, article.body, author, pubDate]
        );
        total++;
        if (total % 50 === 0) console.log(`Progress: ${total}/${TARGET}`);
      } catch (_) { /* skip duplicate */ }
    }
    console.log(`Category "${category}" done`);
  }
  console.log(`\nDone! ${total} articles generated`);
}

main().catch(console.error);
