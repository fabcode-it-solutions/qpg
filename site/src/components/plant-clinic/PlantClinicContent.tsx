"use client";

import React, { useCallback, useEffect } from "react";
import Image from "next/image";
import PlantClinicForm from "./PlantClinicForm";
// import ProtocolDocuments from "./ProtocolDocuments";
import { cn } from "@/lib/utils/utils";
import ProtocolDocuments from "./ProtocolDocuments";
import { useRouter } from "next/navigation";

const PlantClinicContent: React.FC = () => {
  const route = useRouter();

  const checkoutAccess = useCallback(async () => {
    const response = await fetch("/api/dashboard");
    const data = await response.json();

    if (response.ok) {
      if (data.courses.length === 0) {
        route.push("/auth/login");
      }
    }
  }, [route]);
  useEffect(() => {
    checkoutAccess();
  }, []);
  return (
    <section className="relative py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex flex-col md:flex-row items-center mb-24 gap-10 md:gap-4">
          <div
            className={cn(
              "bg-(--color-gold) text-black",
              "px-8 py-6 md:px-10 md:py-11 lg:px-12 lg:py-14 xl:px-14 xl:py-18 2xl:px-17 2xl:py-20",
              "rounded-2xl shadow-lg"
            )}
          >
            <h2
              className={cn(
                "text-4xl md:text-[40px] lg:text-[56px] xl:text-[70px] 2xl:text-[90px]",
                "font-bold uppercase leading-[normal]"
              )}
            >
              Plant Clinic
            </h2>
          </div>

          <div className="relative flex items-end gap-6">
            <div
              className={cn(
                "relative rounded-2xl overflow-visible z-0 mt-12",
                "w-[350px] h-[250px] md:w-[320px] md:h-[250px] lg:w-[410px] lg:h-[300px] xl:w-[550px] xl:h-[380px] 2xl:w-[707px] 2xl:h-[488px]"
              )}
            >
              <Image
                src="/images/stethoscope.png"
                alt="Stethoscope"
                fill
                className="object-fill"
                sizes="(min-width: 1280px) 12rem, 100vw"
              />
            </div>
            <div
              className={cn(
                "absolute rounded-2xl overflow-hidden shadow-xl",
                "left-26 2xl:left-60 xl:left-42 lg:left-32 md:left-23 z-10",
                "w-44 md:w-[170px] md:h-[250px] lg:w-[200px] lg:h-[300px] xl:w-[280px] xl:h-[380px] 2xl:w-[321px] h-[260px] 2xl:h-[500px]"
              )}
            >
              <Image
                src="/images/cannabis.jpg"
                alt="Cannabis plant"
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 12rem, 100vw"
              />
            </div>

            <div
              className={cn(
                "hidden sm:block relative z-20 rounded-2xl overflow-hidden",
                "2xl:right-32 xl:right-25 lg:right-20 md:right-18 sm:right-19 2xl:bottom-32 xl:bottom-25 lg:bottom-20 md:bottom-18 sm:bottom-17",
                "w-44 md:w-[170px] md:h-[250px] lg:w-[200px] lg:h-[300px] xl:w-[280px] xl:h-[380px] 2xl:w-[321px] h-[260px] 2xl:h-[500px]"
              )}
            >
              <Image
                src="/images/man-with-cannabis.jpg"
                alt="Cannabis expert"
                fill
                className="object-cover [object-position:75%_center]"
                sizes="(min-width: 1280px) 12rem, 100vw"
              />
            </div>
          </div>
        </div>
        {/* <div className="text-center mb-12">
          <h1 className="text-[22px] md:text-[28px] lg:text-[36px] 2xl:text-[50px] font-medium text-(--color-gold) mb-2">
            Upload a photo of your plant and questions for Q.
          </h1>

          <p className="text-md 2xl:text-lg 2xl:max-w-[1080px] text-white mx-auto 2xl:leading-[30px]">
            Along with the obvious place to upload photos and type in questions
            we need to tell them to specify if the plant is in vegetative stage
            or flowering stage. If flowering, you must specify what week number
            of the flower stage.
          </p>
        </div> */}

        {/* Protocol Documents Section */}
        <div className="mb-12">
          <ProtocolDocuments />
        </div>

        {/* Form Section */}
        <div className="mx-auto">
          <PlantClinicForm />
        </div>
      </div>
    </section>
  );
};

export default PlantClinicContent;
