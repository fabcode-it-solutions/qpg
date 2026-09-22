import { NextRequest, NextResponse } from "next/server";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";

const courseService = hybridCourseService;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    
    // Validate and sanitize numeric parameters
    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "5";
    
    const page = parseInt(pageParam);
    const limit = parseInt(limitParam);
    
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid page parameter" },
        { status: 400 }
      );
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter (1-100)" },
        { status: 400 }
      );
    }

    let result;

    if (search) {
      const courses = await courseService.searchCourses(search);
      result = { courses, total: courses.length, totalPages: 1 };
    } else if (category) {
      // First get category by slug
      const categoryObj = await courseService.getCategoryBySlug(category);
      if (categoryObj) {
        result = await courseService.getCoursesByCategoryID(
          categoryObj.id,
          page,
          limit
        );
      } else {
        result = { courses: [], total: 0, totalPages: 0 };
      }
    } else {
      result = await courseService.getAllPublishedCourses(page, limit);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get courses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
