export default function Presentation() {
  return (
    <section
      aria-label="Program Penyelidikan Translasiional presentation banner"
      className="mx-auto w-full max-w-7xl px-4 py-4 sm:py-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] md:items-center gap-3 md:gap-10">
        {/* Left: title + logos stacked vertically */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex flex-col items-center md:items-start gap-3">
            <img
              src="/MMU.png"
              alt="Multimedia University (MMU) logo"
              className="h-12 sm:h-14 object-contain"
              loading="lazy"
            />
            <div className="flex flex-col items-center text-center">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                Dengan kolaborasi:
              </div>
              <img
                src="/Meme.png"
                alt="Meme Lab logo"
                className="h-28 sm:h-20 object-contain mx-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="text-center min-w-3xl">
          <h1 className="text-lg sm:text-3xl font-extrabold tracking-tight">
            PROGRAM PENYELIDIKAN TRANSLASIONAL
          </h1>

          <div className="mt-3 space-y-4">
            <p className="mx-auto max-w-2xl text-xl sm:text-xl leading-relaxed">
              Sustainable Energy Solutions for Enhancing Societal Wellbeing and
              Resilient Future of Rural Communities
            </p>
            <p className="mx-auto max-w-2xl text-xl italic leading-relaxed">
              IoT-Assisted Smart Agriculture Plot Prototype with Integrated
              Photovoltaic-Battery Renewable Energy System
            </p>
          </div>

          <div className="mt-5">
            <p className="text-base font-medium">
              KETUA PENYELIDIK (IPT): DR. LEE IT EE
            </p>
          </div>
        </div>

        {/* Right: logos stacked vertically */}
        <div className="flex flex-col items-center md:items-end gap-4">
          <img
            src="/KPT.png"
            alt="Kementerian Pendidikan Tinggi crest"
            className="w-48 -mt-5"
            loading="lazy"
          />
          <div className="pr-4 pt-2">
            <img
              src="/JPT.png"
              alt="Jabatan Pendidikan Tinggi (JPT) logo"
              className="w-52 sm:w-36"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}