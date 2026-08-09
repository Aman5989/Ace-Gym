import RegistrationForm from "@/components/public/RegistrationForm";

export default function RegisterPage() {

  return (

    <main
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-blue-950
        px-4
        py-10
      "
    >

      <div
        className="
          mx-auto
          max-w-2xl
        "
      >


        {/* Header */}

        <div
          className="
            mb-8
            text-center
          "
        >

          <h1
            className="
              text-4xl
              font-bold
              tracking-tight
              text-white
              md:text-5xl
            "
          >
            ACE<span className="text-amber-400">々</span>GYM
          </h1>


          <p
            className="
              mt-3
              text-slate-300
            "
          >
            Join ACE々GYM and start your fitness journey.
          </p>


        </div>






        {/* Form Card */}


        <div
          className="
            rounded-3xl
            border
            border-white/10
            bg-white
            p-6
            shadow-2xl
            md:p-8
          "
        >


          <div
            className="
              mb-6
            "
          >

            <h2
              className="
                text-2xl
                font-bold
                text-slate-900
              "
            >
              Membership Registration
            </h2>


            <p
              className="
                mt-2
                text-sm
                text-slate-500
              "
            >
              Fill in your details to register as a member.
            </p>


          </div>



          <RegistrationForm />


        </div>



        <p
          className="
            mt-6
            text-center
            text-sm
            text-slate-400
          "
        >
          © {new Date().getFullYear()} ACE々GYM. All rights reserved.
        </p>



      </div>


    </main>

  );

}
